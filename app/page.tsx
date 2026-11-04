"use client";

import { useCallback, useRef, useState } from "react";
import BackgroundRenderer from "@/components/background-renderer";
import BackgroundFields from "@/components/background-fields";
import Editor from "@/components/editor";
import AppWidget from "@/components/widgets/app-widget";
import AppWidgetFields from "@/components/widgets/app-widget-fields";
import { BACKGROUND_PRESETS } from "@/lib/background-presets";
import { download, loadFile, stringify, parse } from "@/lib/yaml-parser";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import { DEFAULT_APP_WIDGET } from "@/types/app-widget";

// ─── Full scene config (what gets exported/imported) ─────────────────────────

interface SceneConfig {
  background: BackgroundConfig;
  widgets: WidgetInstance[];
}

function nextId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Drag state ───────────────────────────────────────────────────────────────

interface DragState {
  id: string;
  startMouseX: number;
  startMouseY: number;
  startWidgetX: number;
  startWidgetY: number;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [bg, setBg] = useState<BackgroundConfig>(BACKGROUND_PRESETS["Ocean Dusk"]);
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<"background" | "widgets">("background");
  const [editingId, setEditingId] = useState<string | null>(null);

  const dragRef = useRef<DragState | null>(null);

  // ── Widget drag ────────────────────────────────────────────────────────────

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

  // ── Widget actions ─────────────────────────────────────────────────────────

  function addWidget() {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "app", config: { ...DEFAULT_APP_WIDGET }, x: 40, y: 40 },
    ]);
    setEditingId(id);
    setEditorTab("widgets");
    setEditorOpen(true);
  }

  function deleteWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function updateWidget(id: string, partial: Partial<WidgetInstance>) {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, ...partial } : w)));
  }

  // ── Import / Export ────────────────────────────────────────────────────────

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const scene = await loadFile<SceneConfig>(file);
      if (scene.background) setBg(scene.background);
      if (scene.widgets) setWidgets(scene.widgets);
    } catch {
      // fall back to treating the file as a background-only config
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

  // ── Editing widget ─────────────────────────────────────────────────────────

  const editingWidget = widgets.find((w) => w.id === editingId) ?? null;

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <BackgroundRenderer config={bg} />

      {/* Widgets on canvas */}
      {widgets.map((w) => (
        <div
          key={w.id}
          style={{ position: "absolute", left: w.x, top: w.y, cursor: "grab", userSelect: "none" }}
          onMouseDown={(e) => handleWidgetMouseDown(e, w)}
        >
          {w.type === "app" && (
            <AppWidget
              config={w.config}
              onEdit={() => { setEditingId(w.id); setEditorTab("widgets"); setEditorOpen(true); }}
              onClick={() => { if (w.config.url) window.open(w.config.url, "_blank"); }}
            />
          )}
        </div>
      ))}

      {/* Editor panel */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
        <button
          onClick={() => setEditorOpen((o) => !o)}
          className="px-3 py-1.5 text-sm bg-white/90 backdrop-blur rounded shadow"
        >
          {editorOpen ? "Close" : "Edit"}
        </button>

        {editorOpen && (
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg w-80 max-h-[80vh] flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b shrink-0">
              {(["background", "widgets"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setEditorTab(tab)}
                  className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    editorTab === tab
                      ? "border-b-2 border-black text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto flex-1 p-4">
              {editorTab === "background" && (
                <Editor
                  value={bg}
                  onChange={setBg}
                  renderFields={(val, set) => (
                    <BackgroundFields value={val} onChange={set} />
                  )}
                />
              )}

              {editorTab === "widgets" && (
                <div className="flex flex-col gap-3">
                  {/* Widget list */}
                  {widgets.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No widgets yet</p>
                  )}
                  {widgets.map((w) => (
                    <div
                      key={w.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded border text-sm cursor-pointer hover:bg-black/5 ${
                        editingId === w.id ? "border-black bg-black/5" : "border-transparent"
                      }`}
                      onClick={() => setEditingId(editingId === w.id ? null : w.id)}
                    >
                      <span className="flex-1 truncate font-medium">{w.config.title || "Untitled"}</span>
                      <span className="text-xs text-gray-400 shrink-0">{w.type}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteWidget(w.id); }}
                        className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addWidget}
                    className="text-xs border border-dashed rounded px-2 py-2 text-gray-500 hover:text-black hover:border-black transition-colors"
                  >
                    + Add app widget
                  </button>

                  {/* Inline widget editor */}
                  {editingWidget && editingWidget.type === "app" && (
                    <div className="mt-1 border-t pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                        Edit: {editingWidget.config.title || "Untitled"}
                      </p>
                      <Editor
                        value={editingWidget.config}
                        onChange={(config) => updateWidget(editingWidget.id, { config })}
                        renderFields={(val, set) => (
                          <AppWidgetFields value={val} onChange={set} />
                        )}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Import / Export */}
            <div className="flex gap-2 p-3 border-t shrink-0">
              <button
                onClick={handleExport}
                className="flex-1 px-2 py-1.5 text-xs border rounded hover:bg-black/5"
              >
                Export YAML
              </button>
              <label className="flex-1 px-2 py-1.5 text-xs border rounded hover:bg-black/5 text-center cursor-pointer">
                Import YAML
                <input
                  type="file"
                  accept=".yaml,.yml"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
