"use client";

import { useState } from "react";
import type { AppWidgetConfig } from "@/types/app-widget";
import { TextInput, Toggle, SliderRow, Select, TabBar } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";

type Tab = "general" | "connection" | "dimensions" | "yaml";

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "general",    label: "General"    },
  { id: "connection", label: "Connection" },
  { id: "dimensions", label: "Dimensions" },
  { id: "yaml",       label: "YAML"       },
];

const LOGO_VIEW_OPTIONS = [
  { value: "icon", label: "Icon"       },
  { value: "none", label: "No icon"    },
  { value: "full", label: "Full cover" },
];

export default function AppWidgetFields({ value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [yaml, setYaml] = useState(() => stringify(value));
  const [yamlErr, setYamlErr] = useState<string | null>(null);

  function switchTab(next: Tab) {
    if (next === "yaml") { setYaml(stringify(value)); setYamlErr(null); }
    setTab(next);
  }

  function handleYaml(text: string) {
    setYaml(text);
    try { onChange(parse<AppWidgetConfig>(text)); setYamlErr(null); }
    catch (e) { setYamlErr(e instanceof Error ? e.message : "Invalid YAML"); }
  }

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={TABS} active={tab} onChange={switchTab} />

      {tab === "general" && (
        <div className="flex flex-col gap-4">
          <Select
            label="Logo view"
            value={value.logoView}
            options={LOGO_VIEW_OPTIONS}
            onChange={(v) => onChange({ ...value, logoView: v as AppWidgetConfig["logoView"] })}
          />
          {value.logoView !== "none" && (
            <TextInput
              label="Logo URL"
              value={value.logoUrl ?? ""}
              placeholder="https://example.com/icon.png"
              onChange={(logoUrl) => onChange({ ...value, logoUrl })}
            />
          )}
          <TextInput
            label="Title"
            value={value.title}
            placeholder="My App"
            onChange={(title) => onChange({ ...value, title })}
          />
          <TextInput
            label="Subtitle"
            value={value.subtitle ?? ""}
            placeholder="optional"
            onChange={(subtitle) => onChange({ ...value, subtitle })}
          />
        </div>
      )}

      {tab === "connection" && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="URL"
            value={value.url}
            placeholder="https://example.com"
            onChange={(url) => onChange({ ...value, url })}
          />
          <Toggle
            checked={value.openUrl}
            label="Click to open URL"
            onChange={(openUrl) => onChange({ ...value, openUrl })}
          />
          <Toggle
            checked={value.ping}
            label="Show online status"
            onChange={(ping) => onChange({ ...value, ping })}
          />
          {value.ping && (
            <div className="flex flex-col gap-4 pl-3 border-l-2 border-zinc-700">
              <TextInput
                label="Ping URL"
                value={value.pingUrl ?? ""}
                placeholder="Defaults to URL above"
                onChange={(pingUrl) => onChange({ ...value, pingUrl })}
              />
              <SliderRow
                label="Check every"
                value={value.pingInterval}
                min={10} max={300} step={10}
                display={`${value.pingInterval}s`}
                onChange={(pingInterval) => onChange({ ...value, pingInterval })}
              />
            </div>
          )}
        </div>
      )}

      {tab === "dimensions" && (
        <div className="flex flex-col gap-4">
          <SliderRow
            label="Width"
            value={value.width}
            min={160} max={480} step={8}
            display={`${value.width}px`}
            onChange={(width) => onChange({ ...value, width })}
          />
          <SliderRow
            label="Height"
            value={value.height}
            min={48} max={300} step={4}
            display={`${value.height}px`}
            onChange={(height) => onChange({ ...value, height })}
          />
        </div>
      )}

      {tab === "yaml" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={yaml}
            onChange={(e) => handleYaml(e.target.value)}
            spellCheck={false}
            className="w-full h-56 font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700"
          />
          {yamlErr && (
            <div className="flex gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-red-400 text-xs shrink-0 mt-px">⚠</span>
              <p className="text-xs text-red-400 font-mono leading-snug break-all">{yamlErr}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
