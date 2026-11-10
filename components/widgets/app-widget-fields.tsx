"use client";

import { useState } from "react";
import type { AppWidgetConfig } from "@/types/app-widget";
import { Divider, Select, SliderRow, TabBar, TextInput, Toggle } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";

type Tab = "display" | "visuals" | "connection" | "yaml";

const TABS: { id: Tab; label: string }[] = [
  { id: "display",    label: "Display"    },
  { id: "visuals",    label: "Visuals"    },
  { id: "connection", label: "Connection" },
  { id: "yaml",       label: "YAML"       },
];

const LOGO_VIEW_OPTIONS = [
  { value: "icon", label: "Icon"       },
  { value: "none", label: "No icon"    },
  { value: "full", label: "Full cover" },
];

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
}

export default function AppWidgetFields({ value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("display");
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

      {tab === "display" && (
        <div className="flex flex-col gap-4">
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
          <TextInput
            label="Tooltip"
            value={value.tooltip ?? ""}
            placeholder="Shown on hover"
            onChange={(tooltip) => onChange({ ...value, tooltip })}
          />

          <Divider />

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
          {value.logoView === "full" && (
            <>
              <SliderRow
                label="Icon zoom"
                value={value.iconZoom ?? 1}
                min={1} max={3} step={0.05}
                display={`${Math.round((value.iconZoom ?? 1) * 100)}%`}
                onChange={(iconZoom) => onChange({ ...value, iconZoom })}
              />
              <SliderRow
                label="Offset X"
                value={value.iconOffsetX ?? 0}
                min={-100} max={100} step={1}
                display={`${value.iconOffsetX ?? 0}%`}
                onChange={(iconOffsetX) => onChange({ ...value, iconOffsetX })}
              />
              <SliderRow
                label="Offset Y"
                value={value.iconOffsetY ?? 0}
                min={-100} max={100} step={1}
                display={`${value.iconOffsetY ?? 0}%`}
                onChange={(iconOffsetY) => onChange({ ...value, iconOffsetY })}
              />
            </>
          )}
        </div>
      )}

      {tab === "visuals" && (
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
          <SliderRow
            label="Padding"
            value={value.padding ?? 16}
            min={0} max={48} step={2}
            display={`${value.padding ?? 16}px`}
            onChange={(padding) => onChange({ ...value, padding })}
          />
          <SliderRow
            label="Margin"
            value={value.margin ?? 0}
            min={0} max={64} step={2}
            display={`${value.margin ?? 0}px`}
            onChange={(margin) => onChange({ ...value, margin })}
          />
          <SliderRow
            label="Corner radius"
            value={value.borderRadius ?? 16}
            min={0} max={48} step={1}
            display={`${value.borderRadius ?? 16}px`}
            onChange={(borderRadius) => onChange({ ...value, borderRadius })}
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

          <Divider />

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
