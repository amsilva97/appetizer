"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BackgroundRenderer from "@/components/background-renderer";
import CanvasMenu, { type ContextItem } from "@/components/canvas-menu";
import EditorPanel from "@/components/editor-panel";
import Toolbar from "@/components/toolbar";
import AppWidget from "@/components/widgets/app-widget";
import FeedWidget from "@/components/widgets/feed-widget";
import LayoutWidget from "@/components/widgets/layout-widget";
import { BACKGROUND_PRESETS } from "@/lib/background-presets";
import { download, loadFile, parse } from "@/lib/yaml-parser";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import { DEFAULT_APP_WIDGET } from "@/types/app-widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import { DEFAULT_LAYOUT_WIDGET } from "@/types/layout-widget";
import type { LayoutWidgetConfig } from "@/types/layout-widget";
import { DEFAULT_MENU_WIDGET } from "@/types/menu-widget";
import type { MenuWidgetConfig } from "@/types/menu-widget";
import { DEFAULT_FEED_WIDGET } from "@/types/feed-widget";
import type { FeedWidgetConfig } from "@/types/feed-widget";
import type { UserRole } from "@/lib/auth/users";

interface SceneConfig {
  background: BackgroundConfig;
  widgets: WidgetInstance[];
}

interface DragState {
  id: string;
  startMouseX: number;
  startMouseY: number;
  startWidgetX: number;
  startWidgetY: number;
}

function nextId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Home() {
  const [bg, setBg] = useState<BackgroundConfig>(BACKGROUND_PRESETS["Ocean Dusk"]);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [bgEditorOpen, setBgEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{
    x: number;
    y: number;
    cellTargets: { widgetId: string; cellIndex: number }[];
  } | null>(null);
  const [keyNames, setKeyNames] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then(({ layout }) => {
        if (layout) {
          if (layout.background) setBg(layout.background);
          if (Array.isArray(layout.widgets)) setWidgets(layout.widgets);
        }
      })
      .finally(() => setLoaded(true));

    fetch("/api/me")
      .then((r) => r.ok ? r.json() : { loggedIn: false, role: null })
      .then(({ loggedIn: li, role: r }: { loggedIn: boolean; role: UserRole | null }) => {
        setLoggedIn(li);
        setRole(r);
      })
      .catch(() => {});

    fetch("/api/keys")
      .then((r) => r.ok ? r.json() : { keyNames: [] })
      .then(({ keyNames }: { keyNames: string[] }) => setKeyNames(keyNames))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background: bg, widgets }),
      });
    }, 1000);
  }, [bg, widgets, loaded]);

  const handleWidgetMouseDown = useCallback(
    (e: React.MouseEvent, widget: WidgetInstance) => {
      e.preventDefault();
      dragRef.current = {
        id: widget.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startWidgetX: widget.x,
        startWidgetY: widget.y,
      };
    },
    []
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startMouseX;
    const dy = e.clientY - d.startMouseY;
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === d.id ? { ...w, x: d.startWidgetX + dx, y: d.startWidgetY + dy } : w
      )
    );
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  function detectCellTargets(cx: number, cy: number): { widgetId: string; cellIndex: number }[] {
    const results: { widgetId: string; cellIndex: number }[] = [];

    function traverse(
      widgetId: string,
      containerLeft: number,
      containerTop: number,
      containerRight: number,
      containerBottom: number
    ) {
      const w = widgets.find((w) => w.id === widgetId);
      if (!w) return;
      const cfg = w.config as LayoutWidgetConfig;
      const { columns, rows } = cfg.layout;
      const margin = cfg.margin ?? 0;
      const padding = cfg.padding ?? 0;
      const gap = cfg.gap ?? 0;

      const gridLeft   = containerLeft  + margin + padding;
      const gridTop    = containerTop   + margin + padding;
      const gridRight  = containerRight  - margin - padding;
      const gridBottom = containerBottom - margin - padding;

      if (cx < gridLeft || cx > gridRight || cy < gridTop || cy > gridBottom) return;

      const gridW = gridRight - gridLeft;
      const gridH = gridBottom - gridTop;
      const cellW = (gridW - (columns - 1) * gap) / columns;
      const cellH = (gridH - (rows    - 1) * gap) / rows;

      const col = Math.min(columns - 1, Math.floor((cx - gridLeft) / (cellW + gap)));
      const row = Math.min(rows    - 1, Math.floor((cy - gridTop)  / (cellH + gap)));
      const cellIndex = row * columns + col;

      results.push({ widgetId, cellIndex });

      const child = widgets.find(
        (c) => c.type === "layout" && c.parentId === widgetId && c.cellIndex === cellIndex
      );
      if (child) {
        const cellLeft = gridLeft + col * (cellW + gap);
        const cellTop  = gridTop  + row * (cellH + gap);
        traverse(child.id, cellLeft, cellTop, cellLeft + cellW, cellTop + cellH);
      }
    }

    const TOOLBAR_H = 48;
    for (const w of widgets) {
      if (w.type !== "layout" || w.parentId) continue;
      traverse(w.id, 0, TOOLBAR_H, window.innerWidth, window.innerHeight);
    }

    return results;
  }

  function handleCanvasContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (!editMode) return;
    if ((e.target as HTMLElement).closest("[data-no-menu]")) return;
    const cellTargets = detectCellTargets(e.clientX, e.clientY);
    setMenuPos({ x: e.clientX, y: e.clientY, cellTargets });
  }

  function addWidget() {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "app", config: { ...DEFAULT_APP_WIDGET }, x: 40, y: 100 },
    ]);
    setBgEditorOpen(false);
    setEditingId(id);
  }

  function nextLayoutLabel(): string {
    const taken = new Set(
      widgets.filter((w) => w.type === "layout").map((w) => (w.config as LayoutWidgetConfig).label)
    );
    let n = 1;
    while (taken.has(`Layout ${n}`)) n++;
    return `Layout ${n}`;
  }

  function addLayoutWidget(label: string) {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "layout", config: { ...DEFAULT_LAYOUT_WIDGET, label }, x: 0, y: 0 },
    ]);
    setBgEditorOpen(false);
    setEditingId(id);
  }

  function addSubLayout(parentWidgetId: string, cellIndex: number, label: string) {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "layout", parentId: parentWidgetId, cellIndex, config: { ...DEFAULT_LAYOUT_WIDGET, label }, x: 0, y: 0 },
    ]);
  }

  function nextMenuLabel(): string {
    const taken = new Set(
      widgets.filter((w) => w.type === "menu").map((w) => (w.config as MenuWidgetConfig).label)
    );
    let n = 1;
    while (taken.has(`Menu ${n}`)) n++;
    return `Menu ${n}`;
  }

  function addSubMenu(parentWidgetId: string, cellIndex: number, label: string) {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "menu", parentId: parentWidgetId, cellIndex, config: { ...DEFAULT_MENU_WIDGET, label }, x: 0, y: 0 },
    ]);
    setEditingId(id);
  }

  function addAppToMenu(menuId: string) {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "app", parentId: menuId, config: { ...DEFAULT_APP_WIDGET }, x: 0, y: 0 },
    ]);
    setBgEditorOpen(false);
    setEditingId(id);
  }

  function addFeedWidget() {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "feed", config: { ...DEFAULT_FEED_WIDGET }, x: 40, y: 100 },
    ]);
    setBgEditorOpen(false);
    setEditingId(id);
  }

  function deleteWidget(id: string) {
    setWidgets((prev) => {
      const idsToRemove = new Set<string>();
      const queue = [id];
      while (queue.length) {
        const current = queue.pop()!;
        idsToRemove.add(current);
        prev.filter((w) => w.parentId === current).forEach((w) => queue.push(w.id));
      }
      return prev.filter((w) => !idsToRemove.has(w.id));
    });
    if (editingId === id) setEditingId(null);
  }

  function updateWidget(id: string, partial: Partial<WidgetInstance>) {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...partial } : w)));
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const scene = await loadFile<SceneConfig>(file);
      if (scene.background) setBg(scene.background);
      if (scene.widgets) setWidgets(scene.widgets);
    } catch {
      try {
        const bgOnly = parse<BackgroundConfig>(await file.text());
        setBg(bgOnly);
      } catch {
        // ignore malformed file
      }
    }
    e.target.value = "";
  }

  function handleExport() {
    download<SceneConfig>({ background: bg, widgets }, "scene");
  }

  const editingWidget = widgets.find((w) => w.id === editingId) ?? null;

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleCanvasContextMenu}
    >
      <BackgroundRenderer config={bg} />

      <Toolbar
        editMode={editMode}
        onToggleEdit={() => {
          if (!isAdmin) return;
          setEditMode((m) => {
            if (m) {
              setBgEditorOpen(false);
              setEditingId(null);
              setMenuPos(null);
            }
            return !m;
          });
        }}
        role={role}
        loggedIn={loggedIn}
      />

      {/* Layout widgets — only root layouts, fill canvas below toolbar */}
      {widgets.filter((w) => w.type === "layout" && !w.parentId).map((w) => (
        <div
          key={w.id}
          className="absolute"
          style={{ top: 48, left: 0, right: 0, bottom: 0 }}
        >
          <LayoutWidget
            config={w.config as LayoutWidgetConfig}
            widgetId={w.id}
            allWidgets={widgets}
            editMode={editMode}
          />
        </div>
      ))}

      {/* App widgets — freely positioned, draggable (only those not inside a menu) */}
      {widgets.filter((w) => w.type === "app" && !w.parentId).map((w) => (
        <div
          key={w.id}
          style={{ position: "absolute", left: w.x, top: w.y, cursor: editMode ? "grab" : "default", userSelect: "none" }}
          onMouseDown={(e) => handleWidgetMouseDown(e, w)}
        >
          {(() => {
            const cfg = w.config as AppWidgetConfig;
            return (
              <AppWidget
                config={cfg}

                onClick={() => { if (cfg.url) window.open(cfg.url, "_blank"); }}
              />
            );
          })()}
        </div>
      ))}

      {/* Feed widgets — freely positioned, draggable */}
      {widgets.filter((w) => w.type === "feed").map((w) => (
        <div
          key={w.id}
          style={{ position: "absolute", left: w.x, top: w.y, cursor: editMode ? "grab" : "default", userSelect: "none" }}
          onMouseDown={(e) => handleWidgetMouseDown(e, w)}
        >
          <FeedWidget config={w.config as FeedWidgetConfig} />
        </div>
      ))}

      {editMode && menuPos && (() => {
        const { cellTargets } = menuPos;
        const stackIds = new Set(cellTargets.map((t) => t.widgetId));
        const stackLayouts = widgets.filter((w) => stackIds.has(w.id));
        const stackMenus = cellTargets
          .map((t) => widgets.find((w) => w.type === "menu" && w.parentId === t.widgetId && w.cellIndex === t.cellIndex))
          .filter((w): w is WidgetInstance => w !== undefined);

        const floatingApps = widgets.filter((w) => {
          if (w.type !== "app" || w.parentId) return false;
          const cfg = w.config as AppWidgetConfig;
          const margin = cfg.margin ?? 0;
          const left = w.x + margin;
          const top  = w.y + margin;
          return menuPos.x >= left && menuPos.x <= left + cfg.width
              && menuPos.y >= top  && menuPos.y <= top  + cfg.height;
        });
        const groupedApps = stackMenus.flatMap((g) =>
          widgets.filter((w) => w.type === "app" && w.parentId === g.id)
        );
        const floatingFeeds = widgets.filter((w) => {
          if (w.type !== "feed") return false;
          const cfg = w.config as FeedWidgetConfig;
          return menuPos.x >= w.x && menuPos.x <= w.x + cfg.width
              && menuPos.y >= w.y && menuPos.y <= w.y + cfg.height;
        });

        const editGroup: ContextItem[] = [
          { label: "Edit Background", onClick: () => { setBgEditorOpen(true); setEditingId(null); } },
          ...stackLayouts.map((w) => ({
            label: `Edit ${(w.config as LayoutWidgetConfig).label}`,
            onClick: () => { setBgEditorOpen(false); setEditingId(w.id); },
          })),
          ...stackMenus.map((w) => ({
            label: `Edit ${(w.config as MenuWidgetConfig).label}`,
            onClick: () => { setBgEditorOpen(false); setEditingId(w.id); },
          })),
          ...[...floatingApps, ...groupedApps].map((w) => ({
            label: `Edit ${(w.config as AppWidgetConfig).title || "App"}`,
            onClick: () => { setBgEditorOpen(false); setEditingId(w.id); },
          })),
          ...floatingFeeds.map((w) => ({
            label: `Edit ${(w.config as FeedWidgetConfig).label || "Feed"}`,
            onClick: () => { setBgEditorOpen(false); setEditingId(w.id); },
          })),
        ];

        const addGroup: ContextItem[] = cellTargets.flatMap((t) => {
          const parent = stackLayouts.find((w) => w.id === t.widgetId);
          if (!parent) return [];
          const parentLabel = (parent.config as LayoutWidgetConfig).label;
          return [
            {
              label: `Add Layout to ${parentLabel}`,
              onClick: () => addSubLayout(t.widgetId, t.cellIndex, nextLayoutLabel()),
            },
            {
              label: `Add Menu to ${parentLabel}`,
              onClick: () => addSubMenu(t.widgetId, t.cellIndex, nextMenuLabel()),
            },
          ];
        });
        stackMenus.forEach((w) => {
          addGroup.push({
            label: `Add App to ${(w.config as MenuWidgetConfig).label}`,
            onClick: () => addAppToMenu(w.id),
          });
        });
        addGroup.push({
          label: "Add Layout to Background",
          onClick: () => addLayoutWidget(nextLayoutLabel()),
        });
        addGroup.push({
          label: "Add Feed Widget",
          onClick: () => addFeedWidget(),
        });

        return (
          <CanvasMenu
            x={menuPos.x}
            y={menuPos.y}
            groups={[editGroup, addGroup]}
            onDismiss={() => setMenuPos(null)}
          />
        );
      })()}

      {editMode && (
        <EditorPanel
          bg={bg}
          onBgChange={setBg}
          bgEditorOpen={bgEditorOpen}
          onBgEditorOpenChange={setBgEditorOpen}
          editingWidget={editingWidget}
          onEditingWidgetClose={() => setEditingId(null)}
          onUpdateWidget={updateWidget}
          onDeleteWidget={deleteWidget}
          onExport={handleExport}
          onImport={handleImport}
          keyNames={keyNames}
        />
      )}
    </div>
  );
}
