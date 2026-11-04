"use client";

import type { AppWidgetConfig } from "@/types/app-widget";

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{children}</p>
  );
}

function TextRow({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border rounded bg-white"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full px-2 py-1.5 text-sm border rounded bg-white resize-none"
      />
    </div>
  );
}

export default function AppWidgetFields({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Logo preview */}
      {value.logoUrl && (
        <div className="flex items-center gap-2">
          <img
            src={value.logoUrl}
            alt=""
            className="w-8 h-8 rounded-lg object-contain border"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="text-xs text-gray-400">logo preview</span>
        </div>
      )}

      <TextRow
        label="Logo URL"
        value={value.logoUrl ?? ""}
        placeholder="https://example.com/icon.png"
        onChange={(logoUrl) => onChange({ ...value, logoUrl })}
      />
      <TextRow
        label="Title"
        value={value.title}
        placeholder="My App"
        onChange={(title) => onChange({ ...value, title })}
      />
      <TextRow
        label="Subtitle"
        value={value.subtitle ?? ""}
        placeholder="v2.0 · optional"
        onChange={(subtitle) => onChange({ ...value, subtitle })}
      />
      <TextArea
        label="Description"
        value={value.description ?? ""}
        placeholder="Short description…"
        onChange={(description) => onChange({ ...value, description })}
      />
      <TextRow
        label="URL"
        value={value.url}
        placeholder="https://example.com"
        onChange={(url) => onChange({ ...value, url })}
      />
      <TextRow
        label="Tooltip"
        value={value.tooltip ?? ""}
        placeholder="Shown on hover · optional"
        onChange={(tooltip) => onChange({ ...value, tooltip })}
      />

      {/* Ping */}
      <div>
        <Label>Online check</Label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.ping}
            onChange={(e) => onChange({ ...value, ping: e.target.checked })}
          />
          <span className="text-sm">Ping to show online status</span>
        </label>

        {value.ping && (
          <div className="mt-2 flex flex-col gap-2 pl-5">
            <TextRow
              label="Ping URL"
              value={value.pingUrl ?? ""}
              placeholder="Defaults to URL above"
              onChange={(pingUrl) => onChange({ ...value, pingUrl })}
            />
            <div>
              <Label>Check every</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={10}
                  value={value.pingInterval}
                  onChange={(e) => onChange({ ...value, pingInterval: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-12 text-right">{value.pingInterval}s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
