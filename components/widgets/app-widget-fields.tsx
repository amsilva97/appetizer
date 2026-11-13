"use client";

import { useState } from "react";
import type { AppWidgetConfig, AppFeedConfig, FeedHeaderRow, FeedMethod } from "@/types/app-widget";
import { DEFAULT_FEED_CONFIG } from "@/types/app-widget";
import { Divider, Select, SliderRow, TabBar, TextInput, Toggle } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";
import WidgetPermissionsFields from "@/components/widgets/widget-permissions-fields";
import type { Permission } from "@/types/permissions";

type Tab = "display" | "visuals" | "connection" | "feed" | "yaml" | "permissions";

const TABS: { id: Tab; label: string }[] = [
  { id: "display",     label: "Display"     },
  { id: "visuals",     label: "Visuals"     },
  { id: "connection",  label: "Connection"  },
  { id: "feed",        label: "Feed"        },
  { id: "yaml",        label: "YAML"        },
  { id: "permissions", label: "Permissions" },
];

const METHOD_OPTIONS = [
  { value: "none", label: "None" },
  { value: "GET",  label: "GET"  },
];

const LOGO_VIEW_OPTIONS = [
  { value: "icon", label: "Icon"       },
  { value: "none", label: "No icon"    },
  { value: "full", label: "Full cover" },
];

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
  keyNames?: string[];
  permissions?: string[];
  onPermissionsChange?: (p: string[]) => void;
  availablePermissions?: Permission[];
}

export default function AppWidgetFields({ value, onChange, keyNames = [], permissions = [], onPermissionsChange, availablePermissions = [] }: Props) {
  const feed = value.feed ?? DEFAULT_FEED_CONFIG;

  function setFeed(patch: Partial<AppFeedConfig>) {
    onChange({ ...value, feed: { ...feed, ...patch } });
  }

  function setFeedMethod(method: FeedMethod) {
    if (method === "none") {
      onChange({ ...value, feed: { ...DEFAULT_FEED_CONFIG } });
    } else {
      setFeed({ method });
    }
  }

  function addHeader() {
    setFeed({ headers: [...feed.headers, { key: "", value: "" }] });
  }

  function updateHeader(i: number, patch: Partial<FeedHeaderRow>) {
    setFeed({ headers: feed.headers.map((h, idx) => idx === i ? { ...h, ...patch } : h) });
  }

  function removeHeader(i: number) {
    setFeed({ headers: feed.headers.filter((_, idx) => idx !== i) });
  }
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

      {tab === "feed" && (
        <div className="flex flex-col gap-4">
          <Select
            label="Method"
            value={feed.method}
            options={METHOD_OPTIONS}
            onChange={(m) => setFeedMethod(m as FeedMethod)}
          />

          {feed.method === "GET" && (
            <>
              <TextInput
                label="URL"
                value={feed.url}
                placeholder="https://api.example.com/items"
                onChange={(url) => setFeed({ url })}
              />

              <Divider />

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Headers</span>
                  <button
                    onClick={addHeader}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                  >
                    + Add
                  </button>
                </div>

                {keyNames.length > 0 ? (
                  <p className="text-[10px] text-zinc-600 leading-snug">
                    Use <span className="font-mono text-zinc-500">{"{KEY}"}</span> in values to inject a saved key.
                    Available: {keyNames.map((k) => (
                      <span key={k} className="font-mono text-zinc-500 mr-1">{`{${k}}`}</span>
                    ))}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-600 leading-snug">
                    Use <span className="font-mono text-zinc-500">{"{KEY_NAME}"}</span> in values to inject secrets from the Keys page.
                  </p>
                )}

                {feed.headers.length === 0 && (
                  <p className="text-xs text-zinc-700 py-1">No headers added.</p>
                )}

                {feed.headers.map((h, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={h.key}
                      onChange={(e) => updateHeader(i, { key: e.target.value })}
                      placeholder="Header name"
                      className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                    <input
                      value={h.value}
                      onChange={(e) => updateHeader(i, { value: e.target.value })}
                      placeholder="Value or {KEY}"
                      className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      aria-label="Remove header"
                      className="shrink-0 text-zinc-700 hover:text-red-400 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <Divider />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-400">Transform</span>
                <p className="text-[10px] text-zinc-600 leading-snug">
                  JS expression that receives <span className="font-mono text-zinc-500">body</span> and must return an array.
                </p>
                <textarea
                  value={feed.transform}
                  onChange={(e) => setFeed({ transform: e.target.value })}
                  placeholder={"// body is the parsed JSON response\nbody.items"}
                  spellCheck={false}
                  rows={5}
                  className="w-full font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700"
                />
              </div>

              <Divider />

              <SliderRow
                label="Poll every"
                value={feed.pollInterval}
                min={10} max={300} step={5}
                display={`${feed.pollInterval}s`}
                onChange={(pollInterval) => setFeed({ pollInterval })}
              />
              <SliderRow
                label="Feed height"
                value={feed.height}
                min={80} max={600} step={8}
                display={`${feed.height}px`}
                onChange={(height) => setFeed({ height })}
              />
            </>
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

      {tab === "permissions" && (
        <WidgetPermissionsFields
          permissions={permissions}
          onChange={onPermissionsChange ?? (() => {})}
          available={availablePermissions}
        />
      )}
    </div>
  );
}
