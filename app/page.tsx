"use client";

import { useState } from "react";
import BackgroundRenderer from "@/components/background-renderer";
import BackgroundFields from "@/components/background-fields";
import Editor from "@/components/editor";
import { BACKGROUND_PRESETS } from "@/lib/background-presets";
import { download, loadFile } from "@/lib/yaml-parser";
import type { BackgroundConfig } from "@/types/background";

export default function Home() {
  const [bg, setBg] = useState<BackgroundConfig>(BACKGROUND_PRESETS["Ocean Dusk"]);
  const [editorOpen, setEditorOpen] = useState(false);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const config = await loadFile<BackgroundConfig>(file);
    setBg(config);
    e.target.value = "";
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <BackgroundRenderer config={bg} />

      <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2">
        <button
          onClick={() => setEditorOpen((o) => !o)}
          className="px-3 py-1.5 text-sm bg-white/90 backdrop-blur rounded shadow"
        >
          {editorOpen ? "Close" : "Edit Background"}
        </button>

        {editorOpen && (
          <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-4 w-72 max-h-[70vh] overflow-y-auto">
            <Editor
              value={bg}
              onChange={setBg}
              renderFields={(val, set) => (
                <BackgroundFields value={val} onChange={set} />
              )}
            />
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <button
                onClick={() => download(bg, "background")}
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
