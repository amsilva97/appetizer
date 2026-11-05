"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BackgroundRenderer from "@/components/background-renderer";
import EditorPanel from "@/components/editor-panel";
import AppWidget from "@/components/widgets/app-widget";
import { BACKGROUND_PRESETS } from "@/lib/background-presets";
import { download, loadFile, stringify, parse } from "@/lib/yaml-parser";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import { DEFAULT_APP_WIDGET } from "@/types/app-widget";

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
  const [bgEditorOpen, setBgEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from YAML on mount
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

  // Auto-save to YAML (debounced 1 s) after initial load
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

  function addWidget() {
    const id = nextId();
    setWidgets((prev) => [
      ...prev,
      { id, type: "app", config: { ...DEFAULT_APP_WIDGET }, x: 40, y: 40 },
    ]);
    setBgEditorOpen(false);
    setEditingId(id);
  }

  function deleteWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
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
    >
      <BackgroundRenderer config={bg} />

      {widgets.map((w) => (
        <div
          key={w.id}
          style={{ position: "absolute", left: w.x, top: w.y, cursor: "grab", userSelect: "none" }}
          onMouseDown={(e) => handleWidgetMouseDown(e, w)}
        >
          {w.type === "app" && (
            <AppWidget
              config={w.config}
              onEdit={() => { setBgEditorOpen(false); setEditingId(w.id); }}
              onClick={() => { if (w.config.url) window.open(w.config.url, "_blank"); }}
            />
          )}
        </div>
      ))}

      <EditorPanel
        bg={bg}
        onBgChange={setBg}
        bgEditorOpen={bgEditorOpen}
        onBgEditorOpenChange={setBgEditorOpen}
        editingWidget={editingWidget}
        onEditingWidgetClose={() => setEditingId(null)}
        onUpdateWidget={updateWidget}
        onAddWidget={addWidget}
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  );
}
