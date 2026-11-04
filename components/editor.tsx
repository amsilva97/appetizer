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
      <div className="inline-flex bg-gray-100 rounded-lg p-0.5 self-start">
        {(["ui", "yaml"] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
              mode === m
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
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
            className="w-full h-56 font-mono text-[11px] leading-relaxed bg-gray-950 text-gray-200 rounded-xl p-3 border border-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-gray-600"
          />
          {yamlError && (
            <div className="flex gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-400 text-xs shrink-0 mt-px">⚠</span>
              <p className="text-xs text-red-600 font-mono leading-snug break-all">{yamlError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
