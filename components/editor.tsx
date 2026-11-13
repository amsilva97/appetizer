"use client";

import { useState } from "react";
import { parse, stringify } from "@/lib/yaml-parser";

type Mode = "ui" | "yaml";

interface EditorProps<T> {
  value: T;
  onChange: (value: T) => void;
  renderFields: (value: T, onChange: (value: T) => void) => React.ReactNode;
}

export default function Editor<T>({ value, onChange, renderFields }: EditorProps<T>) {
  const [mode, setMode] = useState<Mode>("ui");
  const [yamlText, setYamlText] = useState(() => stringify(value));
  const [yamlError, setYamlError] = useState<string | null>(null);

  function handleModeSwitch(next: Mode) {
    if (next === "yaml") {
      setYamlText(stringify(value));
      setYamlError(null);
    }
    setMode(next);
  }

  function handleYamlChange(text: string) {
    setYamlText(text);
    try {
      onChange(parse<T>(text));
      setYamlError(null);
    } catch (e) {
      setYamlError(e instanceof Error ? e.message : "Invalid YAML");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex bg-zinc-800 border border-zinc-700 rounded-lg p-0.5 self-start">
        {(["ui", "yaml"] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
              mode === m
                ? "bg-zinc-100 text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {m === "ui" ? "Visual" : "YAML"}
          </button>
        ))}
      </div>

      {mode === "ui" && renderFields(value, onChange)}

      {mode === "yaml" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={yamlText}
            onChange={(e) => handleYamlChange(e.target.value)}
            spellCheck={false}
            className="w-full h-56 font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
          {yamlError && (
            <div className="flex gap-2 px-3 py-2 bg-red-500/[0.1] border border-red-500/30 rounded-lg">
              <span className="text-red-400 text-xs shrink-0 mt-px">⚠</span>
              <p className="text-xs text-red-400 font-mono leading-snug break-all">{yamlError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
