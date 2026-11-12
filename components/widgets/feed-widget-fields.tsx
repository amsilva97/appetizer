"use client";

import { useState } from "react";
import type { FeedWidgetConfig, FeedHeaderRow, FeedMethod } from "@/types/feed-widget";
import { DEFAULT_FEED_CONNECTION } from "@/types/feed-widget";
import { Divider, Select, SliderRow, TabBar, TextInput } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";

type Tab = "display" | "connection" | "visuals" | "yaml";

const TABS: { id: Tab; label: string }[] = [
  { id: "display",    label: "Display"    },
  { id: "connection", label: "Connection" },
  { id: "visuals",    label: "Visuals"    },
  { id: "yaml",       label: "YAML"       },
];

const METHOD_OPTIONS = [
  { value: "none", label: "None" },
  { value: "GET",  label: "GET"  },
];

interface Props {
  value: FeedWidgetConfig;
  onChange: (v: FeedWidgetConfig) => void;
  keyNames?: string[];
}

export default function FeedWidgetFields({ value, onChange, keyNames = [] }: Props) {
  const [tab, setTab] = useState<Tab>("display");
  const [yaml, setYaml] = useState(() => stringify(value));
  const [yamlErr, setYamlErr] = useState<string | null>(null);

  function switchTab(next: Tab) {
    if (next === "yaml") { setYaml(stringify(value)); setYamlErr(null); }
    setTab(next);
  }

  function handleYaml(text: string) {
    setYaml(text);
    try { onChange(parse<FeedWidgetConfig>(text)); setYamlErr(null); }
    catch (e) { setYamlErr(e instanceof Error ? e.message : "Invalid YAML"); }
  }

  function setMethod(method: FeedMethod) {
    if (method === "none") {
      onChange({ ...value, connection: { ...DEFAULT_FEED_CONNECTION } });
    } else {
      onChange({ ...value, connection: { ...value.connection, method } });
    }
  }

  function setConnection<K extends keyof FeedWidgetConfig["connection"]>(
    key: K,
    val: FeedWidgetConfig["connection"][K]
  ) {
    onChange({ ...value, connection: { ...value.connection, [key]: val } });
  }

  function addHeader() {
    setConnection("headers", [...value.connection.headers, { key: "", value: "" }]);
  }

  function updateHeader(i: number, patch: Partial<FeedHeaderRow>) {
    const next = value.connection.headers.map((h, idx) =>
      idx === i ? { ...h, ...patch } : h
    );
    setConnection("headers", next);
  }

  function removeHeader(i: number) {
    setConnection("headers", value.connection.headers.filter((_, idx) => idx !== i));
  }

  const conn = value.connection;

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={TABS} active={tab} onChange={switchTab} />

      {tab === "display" && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Label"
            value={value.label}
            placeholder="Feed"
            onChange={(label) => onChange({ ...value, label })}
          />
          <SliderRow
            label="Poll interval"
            value={value.pollInterval}
            min={10} max={300} step={5}
            display={`${value.pollInterval}s`}
            onChange={(pollInterval) => onChange({ ...value, pollInterval })}
          />
        </div>
      )}

      {tab === "connection" && (
        <div className="flex flex-col gap-4">
          <Select
            label="Method"
            value={conn.method}
            options={METHOD_OPTIONS}
            onChange={(m) => setMethod(m as FeedMethod)}
          />

          {conn.method === "GET" && (
            <>
              <TextInput
                label="URL"
                value={conn.url}
                placeholder="https://api.example.com/items"
                onChange={(url) => setConnection("url", url)}
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

                {keyNames.length > 0 && (
                  <p className="text-[10px] text-zinc-600 leading-snug">
                    Use <span className="font-mono text-zinc-500">{"{KEY}"}</span> in values to inject a saved key.
                    Available: {keyNames.map((k) => (
                      <span key={k} className="font-mono text-zinc-500 mr-1">{`{${k}}`}</span>
                    ))}
                  </p>
                )}
                {keyNames.length === 0 && (
                  <p className="text-[10px] text-zinc-600 leading-snug">
                    Use <span className="font-mono text-zinc-500">{"{KEY_NAME}"}</span> in values to inject secrets from the Keys page.
                  </p>
                )}

                {conn.headers.length === 0 && (
                  <p className="text-xs text-zinc-700 py-1">No headers added.</p>
                )}

                {conn.headers.map((h, i) => (
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
                  value={conn.transform}
                  onChange={(e) => setConnection("transform", e.target.value)}
                  placeholder={"// body is the parsed JSON response\nbody.items"}
                  spellCheck={false}
                  rows={5}
                  className="w-full font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-700"
                />
              </div>
            </>
          )}
        </div>
      )}

      {tab === "visuals" && (
        <div className="flex flex-col gap-4">
          <SliderRow
            label="Width"
            value={value.width}
            min={160} max={640} step={8}
            display={`${value.width}px`}
            onChange={(width) => onChange({ ...value, width })}
          />
          <SliderRow
            label="Height"
            value={value.height}
            min={120} max={600} step={8}
            display={`${value.height}px`}
            onChange={(height) => onChange({ ...value, height })}
          />
          <SliderRow
            label="Corner radius"
            value={value.borderRadius}
            min={0} max={48} step={1}
            display={`${value.borderRadius}px`}
            onChange={(borderRadius) => onChange({ ...value, borderRadius })}
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
