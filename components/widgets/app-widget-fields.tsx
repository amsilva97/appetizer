"use client";

import { useState } from "react";
import type { AppWidgetConfig } from "@/types/app-widget";
import { TextInput, TextArea, Toggle, SliderRow, TabBar } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";

type Tab = "general" | "connection" | "yaml";

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "connection", label: "Connection" },
  { id: "yaml", label: "YAML" },
];

export default function AppWidgetFields({ value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [yamlText, setYamlText] = useState(() => stringify(value));
  const [yamlError, setYamlError] = useState<string | null>(null);

  function handleTabChange(next: Tab) {
    if (next === "yaml") {
      setYamlText(stringify(value));
      setYamlError(null);
    }
    setTab(next);
  }

  function handleYamlChange(text: string) {
    setYamlText(text);
    try {
      onChange(parse<AppWidgetConfig>(text));
      setYamlError(null);
    } catch (e) {
      setYamlError(e instanceof Error ? e.message : "Invalid YAML");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={TABS} active={tab} onChange={handleTabChange} />

      {tab === "general" && (
        <div className="flex flex-col gap-4">
          {value.logoUrl && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700">
              <img
                src={value.logoUrl}
                alt=""
                className="w-9 h-9 rounded-xl object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate leading-tight">
                  {value.title || "Untitled"}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Logo preview</p>
              </div>
            </div>
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
            placeholder="v2.0 · optional"
            onChange={(subtitle) => onChange({ ...value, subtitle })}
          />
          <TextArea
            label="Description"
            value={value.description ?? ""}
            placeholder="Short description…"
            rows={2}
            onChange={(description) => onChange({ ...value, description })}
          />
          <TextInput
            label="Logo URL"
            value={value.logoUrl ?? ""}
            placeholder="https://example.com/icon.png"
            onChange={(logoUrl) => onChange({ ...value, logoUrl })}
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
          <TextInput
            label="Tooltip"
            value={value.tooltip ?? ""}
            placeholder="Shown on hover · optional"
            onChange={(tooltip) => onChange({ ...value, tooltip })}
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

      {tab === "yaml" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={yamlText}
            onChange={(e) => handleYamlChange(e.target.value)}
            spellCheck={false}
            className="w-full h-56 font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700"
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
