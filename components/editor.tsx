"use client";

import { useState } from "react";
import { parse, stringify } from "@/lib/yaml-parser";

type Mode = "ui" | "yaml";

interface EditorProps<T> {
  value: T;
  onChange: (value: T) => void;
  renderFields: (value: T, onChange: (value: T) => void) => React.ReactNode;
}

export default function Editor<T>({
  value,
  onChange,
  renderFields,
}: EditorProps<T>) {
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
    <div>
      <div>
        <button onClick={() => handleModeSwitch("ui")} disabled={mode === "ui"}>
          UI
        </button>
        <button
          onClick={() => handleModeSwitch("yaml")}
          disabled={mode === "yaml"}
        >
          YAML
        </button>
      </div>

      {mode === "ui" && renderFields(value, onChange)}

      {mode === "yaml" && (
        <div>
          <textarea
            value={yamlText}
            onChange={(e) => handleYamlChange(e.target.value)}
            spellCheck={false}
          />
          {yamlError && <p>{yamlError}</p>}
        </div>
      )}
    </div>
  );
}
