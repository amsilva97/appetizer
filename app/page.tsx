"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BackgroundRenderer from "@/components/background-renderer";
import CanvasMenu, { type ContextItem } from "@/components/canvas-menu";
import EditorPanel from "@/components/editor-panel";
import Toolbar from "@/components/toolbar";
import AppWidget from "@/components/widgets/app-widget";
import LayoutWidget from "@/components/widgets/layout-widget";
import { BACKGROUND_PRESETS } from "@/lib/background-presets";
import { download, loadFile, parse } from "@/lib/yaml-parser";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import { DEFAULT_APP_WIDGET } from "@/types/app-widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import { DEFAULT_LAYOUT_WIDGET } from "@/types/layout-widget";
import type { LayoutWidgetConfig } from "@/types/layout-widget";

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
    cellTarget: { widgetId: string; cellIndex: number } | null;
  } | null>(null);

  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function detectCellTarget(cx: number, cy: number): { widgetId: string; cellIndex: number } | null {
    const TOOLBAR_H = 48;
    for (const w of widgets) {
      if (w.type !== "layout" || w.parentId) continue;
      const cfg = w.config as LayoutWidgetConfig;
      const { columns, rows } = cfg.layout;
      const { margin, padding, gap } = cfg;

      const gridLeft   = margin + padding;
      const gridTop    = TOOLBAR_H + margin + padding;
      const gridRight  = window.innerWidth  - margin - padding;
      const gridBottom = window.innerHeight - margin - padding;

      if (cx < gridLeft || cx > gridRight || cy < gridTop || cy > gridBottom) continue;

      const gridW = gridRight  - gridLeft;
      const gridH = gridBottom - gridTop;
      const cellW = (gridW - (columns - 1) * gap) / columns;
      const cellH = (gridH - (rows    - 1) * gap) / rows;

      const col = Math.min(columns - 1, Math.floor((cx - gridLeft) / (cellW + gap)));
      const row = Math.min(rows    - 1, Math.floor((cy - gridTop)  / (cellH + gap)));

      return { widgetId: w.id, cellIndex: row * columns + col };
    }
    return null;
  }

  function handleCanvasContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (!editMode) return;
    if ((e.target as HTMLElement).closest("[data-no-menu]")) return;
    const cellTarget = detectCellTarget(e.clientX, e.clientY);
    setMenuPos({ x: e.clientX, y: e.clientY, cellTarget });
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
      { id, type: "layout", config: { label, layout: { type: "grid", columns: DEFAULT_LAYOUT_WIDGET.layout.columns, rows: DEFAULT_LAYOUT_WIDGET.layout.rows }, padding: 0, gap: 0, margin: 0 }, x: 0, y: 0 },
    ]);
    setBgEditorOpen(false);
    setEditingId(id);
  }

  function addSubLayout(parentWidgetId: string, cellIndex: number, label: string) {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      {
        id,
        type: "layout",
        parentId: parentWidgetId,
        cellIndex,
        config: {
          label,
          layout: { type: "grid", columns: DEFAULT_LAYOUT_WIDGET.layout.columns, rows: DEFAULT_LAYOUT_WIDGET.layout.rows },
          padding: 0,
          gap: 0,
          margin: 0,
        } as LayoutWidgetConfig,
        x: 0,
        y: 0,
      },
    ]);
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
          setEditMode((m) => {
            if (m) {
              setBgEditorOpen(false);
              setEditingId(null);
              setMenuPos(null);
            }
            return !m;
          });
        }}
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

      {/* App widgets — freely positioned, draggable */}
      {widgets.filter((w) => w.type === "app").map((w) => (
        <div
          key={w.id}
          data-no-menu
          style={{ position: "absolute", left: w.x, top: w.y, cursor: "grab", userSelect: "none" }}
          onMouseDown={(e) => handleWidgetMouseDown(e, w)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {(() => {
            const cfg = w.config as AppWidgetConfig;
            return (
              <AppWidget
                config={cfg}
                onEdit={() => { setBgEditorOpen(false); setEditingId(w.id); }}
                onClick={() => { if (cfg.url) window.open(cfg.url, "_blank"); }}
              />
            );
          })()}
        </div>
      ))}

      {editMode && menuPos && (() => {
        const layouts = widgets.filter((w) => w.type === "layout");

        const editGroup: ContextItem[] = [
          { label: "Edit Background", onClick: () => { setBgEditorOpen(true); setEditingId(null); } },
          ...layouts.map((w) => ({
            label: `Edit ${(w.config as LayoutWidgetConfig).label}`,
            onClick: () => { setBgEditorOpen(false); setEditingId(w.id); },
          })),
        ];

        const addGroup: ContextItem[] = [];
        const { cellTarget } = menuPos;
        if (cellTarget) {
          const parent = layouts.find((w) => w.id === cellTarget.widgetId);
          if (parent) {
            addGroup.push({
              label: `Add Layout to ${(parent.config as LayoutWidgetConfig).label}`,
              onClick: () => addSubLayout(cellTarget.widgetId, cellTarget.cellIndex, nextLayoutLabel()),
            });
          }
        }
        addGroup.push({
          label: "Add Layout to Background",
          onClick: () => addLayoutWidget(nextLayoutLabel()),
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
        />
      )}
    </div>
  );
}
