"use client";

import type { AppWidgetConfig } from "@/types/app-widget";
import { TextInput, TextArea, Toggle, SliderRow, Divider } from "@/components/ui";

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
}

export default function AppWidgetFields({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">

      {/* Logo preview */}
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

      {/* Identity */}
      <TextInput
        label="Logo URL"
        value={value.logoUrl ?? ""}
        placeholder="https://example.com/icon.png"
        onChange={(logoUrl) => onChange({ ...value, logoUrl })}
      />
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

      <Divider />

      {/* Link */}
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

      <Divider />

      {/* Online check */}
      <Toggle
        checked={value.ping}
        label="Show online status"
        onChange={(ping) => onChange({ ...value, ping })}
      />

      {value.ping && (
        <div className="flex flex-col gap-4 pl-3 border-l-2 border-gray-100">
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
  );
}
