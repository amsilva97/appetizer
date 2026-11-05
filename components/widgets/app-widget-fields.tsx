"use client";

import { useState } from "react";
import type { AppWidgetConfig } from "@/types/app-widget";
import { TextInput, TextArea, Toggle, SliderRow, Select, TabBar } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";

type Tab = "general" | "connection" | "dimensions" | "yaml";

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "connection", label: "Connection" },
  { id: "dimensions", label: "Dimensions" },
  { id: "yaml", label: "YAML" },
];

const LOGO_VIEW_OPTIONS = [
  { value: "icon", label: "Icon" },
  { value: "none", label: "No Icon" },
  { value: "full", label: "Full Cover" },
];

export default function AppWidgetFields({ value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [yamlText, setYamlText] = useState(() => stringify(value));
  const [yamlError, setYamlError] = useState<string | null>(null);

  const logoView = value.logoView ?? "icon";
  const clickable = value.clickable ?? true;
  const showLastPing = value.showLastPing ?? false;

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
          <Select
            label="Logo view"
            value={logoView}
            options={LOGO_VIEW_OPTIONS}
            onChange={(v) => onChange({ ...value, logoView: v as AppWidgetConfig["logoView"] })}
          />

          {/* Logo URL — hidden for "none" view */}
          {logoView !== "none" && (
            <TextInput
              label="Logo URL"
              value={value.logoUrl ?? ""}
              placeholder="https://example.com/icon.png"
              onChange={(logoUrl) => onChange({ ...value, logoUrl })}
            />
          )}

          {/* Logo preview — only for icon view */}
          {logoView === "icon" && value.logoUrl && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700">
              <img
                src={value.logoUrl}
                alt=""
                className="w-9 h-9 rounded-[8px] object-contain shrink-0"
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
            checked={clickable}
            label="Click to open URL"
            onChange={(v) => onChange({ ...value, clickable: v })}
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
              <Toggle
                checked={showLastPing}
                label="Show last checked time"
                onChange={(v) => onChange({ ...value, showLastPing: v })}
              />
            </div>
          )}
        </div>
      )}

      {tab === "dimensions" && (
        <div className="flex flex-col gap-4">
          <SliderRow
            label="Width"
            value={value.cardWidth ?? 256}
            min={160} max={480} step={8}
            display={`${value.cardWidth ?? 256}px`}
            onChange={(cardWidth) => onChange({ ...value, cardWidth })}
          />
          <SliderRow
            label="Height"
            value={value.cardHeight ?? 64}
            min={48} max={300} step={4}
            display={`${value.cardHeight ?? 64}px`}
            onChange={(cardHeight) => onChange({ ...value, cardHeight })}
          />
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
