"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import BackgroundRenderer from "@/components/background-renderer";
import CanvasMenu, { type ContextItem } from "@/components/canvas-menu";
import EditorPanel from "@/components/editor-panel";
import Toolbar from "@/components/toolbar";
import AppWidget from "@/components/widgets/app-widget";
import LayoutWidget from "@/components/widgets/layout-widget";
import { PageContext } from "@/lib/page-context";
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
import type { Capability, PageMeta, Permission } from "@/types/permissions";
import { adminTabsFor } from "@/lib/admin-tabs";
import type { ToolbarStyle } from "@/types/toolbar";
import type { MobileConfig } from "@/types/mobile";
import MobileView from "@/components/mobile/mobile-view";
import MobileEditor from "@/components/mobile/mobile-editor";
import { DEFAULT_MOBILE, openAppUrl } from "@/lib/mobile";
import { cellTargetsFromElements, type CellTarget } from "@/lib/cell-targets";
import { resolveSpacing } from "@/types/spacing";
import { useWidgetDraft } from "@/lib/use-widget-draft";

interface SceneConfig {
  background: BackgroundConfig;
  widgets: WidgetInstance[];
}

const TYPE_NAMES: Record<WidgetInstance["type"], string> = {
  app: "App",
  layout: "Layout",
  menu: "Menu",
};

/** "Sidebar (Layout)": the widget's own name plus what kind of widget it is. */
function describeWidget(w: WidgetInstance): string {
  const name = w.type === "app"
    ? (w.config as AppWidgetConfig).title || "Untitled App"
    : (w.config as LayoutWidgetConfig | MenuWidgetConfig).label || TYPE_NAMES[w.type];
  return `${name} (${TYPE_NAMES[w.type]})`;
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
    cellTargets: CellTarget[];
  } | null>(null);
  const [keyNames, setKeyNames] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [currentPage, setCurrentPage] = useState<string>("");
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [toolbarStyle, setToolbarStyle] = useState<ToolbarStyle>({});
  const [mobileConfig, setMobileConfig] = useState<MobileConfig>(DEFAULT_MOBILE);
  const [mobileEnabled, setMobileEnabled] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);

  const draft = useWidgetDraft(widgets, editingId, updateWidget);
  const viewWidgets = draft.viewWidgets;

  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPageRef = useRef<string>("");

  // What the UI offers; the server checks every call again.
  const caps = new Set(capabilities);
  const canEdit = caps.has("pages:update");
  const canCreatePage = caps.has("pages:write");
  const canDeletePage = caps.has("pages:delete");
  const adminLinks = adminTabsFor(caps);

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then(({ pages: pg, activePage, layout, mobileEnabled: me }) => {
        const pageList: PageMeta[] = pg ?? [];
        setPages(pageList);
        setCurrentPage(activePage ?? "");
        currentPageRef.current = activePage ?? "";
        setMobileEnabled(me ?? false);
        if (layout) {
          if (layout.background) setBg(layout.background);
          if (Array.isArray(layout.widgets)) setWidgets(layout.widgets);
          setToolbarStyle(layout.toolbarStyle ?? {});
          setMobileConfig(layout.mobile ?? DEFAULT_MOBILE);
        }
      })
      .finally(() => setLoaded(true));

    fetch("/api/me")
      .then((r) => r.ok ? r.json() : { loggedIn: false, capabilities: [] })
      .then(({ loggedIn: li, capabilities: c }: { loggedIn: boolean; capabilities?: Capability[] }) => {
        const held = new Set(c ?? []);
        setLoggedIn(li);
        setCapabilities([...held]);
        if (held.has("pages:update") || held.has("roles:read")) {
          fetch("/api/admin/permissions")
            .then((res) => res.ok ? res.json() : { permissions: [] })
            .then(({ permissions }) => setAvailablePermissions(permissions ?? []))
            .catch(() => {});
        }
        if (held.has("keys:read")) {
          fetch("/api/keys")
            .then((r) => r.ok ? r.json() : { keyNames: [] })
            .then(({ keyNames }: { keyNames: string[] }) => setKeyNames(keyNames))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Only editors save; everyone else would just get a 403 back.
    if (!loaded || !canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const page = currentPageRef.current;
      fetch(`/api/state${page ? `?page=${encodeURIComponent(page)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background: bg, widgets, toolbarStyle, mobile: mobileConfig, mobileEnabled }),
      });
    }, 1000);
  }, [bg, widgets, toolbarStyle, mobileConfig, mobileEnabled, loaded, canEdit]);

  async function switchPage(pageName: string) {
    if (pageName === currentPageRef.current) return;
    setLoaded(false);
    try {
      const data = await fetch(`/api/state?page=${encodeURIComponent(pageName)}`).then((r) => r.json());
      const pageList: PageMeta[] = data.pages ?? [];
      setPages(pageList);
      setCurrentPage(data.activePage ?? pageName);
      currentPageRef.current = data.activePage ?? pageName;
      if (data.layout) {
        setBg(data.layout.background ?? BACKGROUND_PRESETS["Ocean Dusk"]);
        setWidgets(data.layout.widgets ?? []);
        setToolbarStyle(data.layout.toolbarStyle ?? {});
        setMobileConfig(data.layout.mobile ?? DEFAULT_MOBILE);
      } else {
        setBg(BACKGROUND_PRESETS["Ocean Dusk"]);
        setWidgets([]);
        setToolbarStyle({});
        setMobileConfig(DEFAULT_MOBILE);
      }
      openEditor(null);
      setMenuPos(null);
    } finally {
      setLoaded(true);
    }
  }

  async function handleCreatePage() {
    const label = prompt("New page name:");
    if (!label?.trim()) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    if (!res.ok) return;
    const { page } = await res.json() as { page: PageMeta };
    setPages((prev) => [...prev, page]);
    await switchPage(page.name);
  }

  async function handleUpdatePage(name: string, patch: { label?: string; permissions?: string[] }) {
    const res = await fetch(`/api/pages/${encodeURIComponent(name)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const { page } = await res.json() as { page: PageMeta };
    setPages((prev) => prev.map((p) => (p.name === name ? page : p)));
  }

  async function handleDeletePage(name: string) {
    if (!confirm(`Delete page "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/pages/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (!res.ok) return;
    const remaining = pages.filter((p) => p.name !== name);
    setPages(remaining);
    if (currentPage === name && remaining.length > 0) {
      await switchPage(remaining[0].name);
    }
  }

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

  /** Layout cells under a point, outermost first, read from what's drawn. */
  function detectCellTargets(cx: number, cy: number): CellTarget[] {
    return cellTargetsFromElements(document.elementsFromPoint(cx, cy));
  }

  function handleCanvasContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (!editMode) return;
    if ((e.target as HTMLElement).closest("[data-no-menu]")) return;
    const cellTargets = detectCellTargets(e.clientX, e.clientY);
    setMenuPos({ x: e.clientX, y: e.clientY, cellTargets });
  }

  /** Open a widget in the editor (or close it with null). Unsaved edits are dropped. */
  function openEditor(id: string | null) {
    setEditingId(id);
    draft.reset();
  }

  function addWidget() {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "app", config: { ...DEFAULT_APP_WIDGET }, x: 40, y: 100 },
    ]);
    setBgEditorOpen(false);
    openEditor(id);
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
    openEditor(id);
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
    openEditor(id);
  }

  function addAppToMenu(menuId: string) {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "app", parentId: menuId, config: { ...DEFAULT_APP_WIDGET }, x: 0, y: 0 },
    ]);
    setBgEditorOpen(false);
    openEditor(id);
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
    if (editingId === id) openEditor(null);
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

  const isMobileViewport = useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerWidth < 768,
    () => false
  );
  const showMobileView = mobileEnabled && isMobileViewport && !editMode;

  return (
    <PageContext.Provider value={currentPage}>
    <div
      className="w-screen h-screen relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleCanvasContextMenu}
    >
      {showMobileView && (
        <MobileView config={mobileConfig} widgets={widgets} background={bg} />
      )}

      {!showMobileView && <BackgroundRenderer config={bg} />}

      <Toolbar
        editMode={editMode}
        onToggleEdit={() => {
          if (!canEdit) return;
          setEditMode((m) => {
            if (m) {
              setBgEditorOpen(false);
              openEditor(null);
              setMenuPos(null);
            }
            return !m;
          });
        }}
        canEdit={canEdit}
        adminLinks={adminLinks}
        loggedIn={loggedIn}
        pages={pages}
        currentPage={currentPage}
        onPageChange={switchPage}
        onCreatePage={canCreatePage ? handleCreatePage : undefined}
        onUpdatePage={canEdit ? handleUpdatePage : undefined}
        onDeletePage={canDeletePage ? handleDeletePage : undefined}
        availablePermissions={availablePermissions}
        toolbarStyle={toolbarStyle}
        onToolbarStyleChange={canEdit ? setToolbarStyle : undefined}
        mobileEditorOpen={mobileEditorOpen}
        onMobileEditorToggle={canEdit && editMode ? () => setMobileEditorOpen((o) => !o) : undefined}
        mobileEnabled={mobileEnabled}
      />

      {/* Layout widgets — only root layouts, fill canvas below toolbar. Hidden while the phone view is showing. */}
      {!showMobileView && viewWidgets.filter((w) => w.type === "layout" && !w.parentId).map((w) => (
        <div
          key={w.id}
          className="absolute"
          style={{ top: toolbarStyle.height ?? 48, left: 0, right: 0, bottom: 0 }}
        >
          <LayoutWidget
            config={w.config as LayoutWidgetConfig}
            widgetId={w.id}
            allWidgets={viewWidgets}
            editMode={editMode}
          />
        </div>
      ))}

      {/* App widgets — freely positioned, draggable (only those not inside a menu) */}
      {!showMobileView && viewWidgets.filter((w) => w.type === "app" && !w.parentId).map((w) => (
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
                widgetId={w.id}
                onClick={() => openAppUrl(cfg.url)}
              />
            );
          })()}
        </div>
      ))}

      {editMode && menuPos && (() => {
        const { cellTargets } = menuPos;
        const stackIds = new Set(cellTargets.map((t) => t.widgetId));
        const stackLayouts = cellTargets
          .map((t) => viewWidgets.find((w) => w.id === t.widgetId))
          .filter((w): w is WidgetInstance => w !== undefined && stackIds.has(w.id));
        const stackMenus = cellTargets
          .map((t) => viewWidgets.find((w) => w.type === "menu" && w.parentId === t.widgetId && w.cellIndex === t.cellIndex))
          .filter((w): w is WidgetInstance => w !== undefined);

        const floatingApps = viewWidgets.filter((w) => {
          if (w.type !== "app" || w.parentId) return false;
          const cfg = w.config as AppWidgetConfig;
          const margin = resolveSpacing(cfg.margin, 0);
          const left = w.x + margin.left;
          const top  = w.y + margin.top;
          return menuPos.x >= left && menuPos.x <= left + cfg.width
              && menuPos.y >= top  && menuPos.y <= top  + cfg.height;
        });
        const groupedApps = stackMenus.flatMap((g) =>
          viewWidgets.filter((w) => w.type === "app" && w.parentId === g.id)
        );
        const editGroup: ContextItem[] = [
          { label: "Edit Background", onClick: () => { setBgEditorOpen(true); openEditor(null); } },
          ...[...stackLayouts, ...stackMenus, ...floatingApps, ...groupedApps].map((w) => ({
            label: `Edit ${describeWidget(w)}`,
            onClick: () => { setBgEditorOpen(false); openEditor(w.id); },
          })),
        ];

        const addGroup: ContextItem[] = cellTargets.flatMap((t) => {
          const parent = stackLayouts.find((w) => w.id === t.widgetId);
          if (!parent) return [];
          const parentLabel = describeWidget(parent);
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
            label: `Add App to ${describeWidget(w)}`,
            onClick: () => addAppToMenu(w.id),
          });
        });
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
          editingWidget={draft.editingWidget}
          onEditingWidgetClose={() => openEditor(null)}
          hasChanges={draft.hasChanges}
          onDraftChange={draft.change}
          onSaveDraft={draft.save}
          onRevertDraft={draft.revert}
          onDeleteWidget={deleteWidget}
          onExport={handleExport}
          onImport={handleImport}
          keyNames={keyNames}
          availablePermissions={availablePermissions}
        />
      )}

      {mobileEditorOpen && canEdit && (
        <MobileEditor
          pageLabel={pages.find((p) => p.name === currentPage)?.label ?? currentPage}
          mobile={mobileConfig}
          widgets={widgets}
          mobileEnabled={mobileEnabled}
          onMobileChange={setMobileConfig}
          onMobileEnabledChange={setMobileEnabled}
          onClose={() => setMobileEditorOpen(false)}
        />
      )}
    </div>
    </PageContext.Provider>
  );
}
