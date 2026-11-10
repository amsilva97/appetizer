"use client";

import { useState } from "react";
import type { LayoutWidgetConfig } from "@/types/layout-widget";
import { Divider, Field, SliderRow, Swatch, TabBar, TextInput } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";

type Tab = "display" | "visuals" | "yaml";

const TABS: { id: Tab; label: string }[] = [
  { id: "display", label: "Display" },
  { id: "visuals", label: "Visuals" },
  { id: "yaml",    label: "YAML"    },
];

interface Props {
  value: LayoutWidgetConfig;
  onChange: (v: LayoutWidgetConfig) => void;
}

export default function LayoutWidgetFields({ value, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("display");
  const [yaml, setYaml] = useState(() => stringify(value));
  const [yamlErr, setYamlErr] = useState<string | null>(null);

  function switchTab(next: Tab) {
    if (next === "yaml") { setYaml(stringify(value)); setYamlErr(null); }
    setTab(next);
  }

  function handleYaml(text: string) {
    setYaml(text);
    try { onChange(parse<LayoutWidgetConfig>(text)); setYamlErr(null); }
    catch (e) { setYamlErr(e instanceof Error ? e.message : "Invalid YAML"); }
  }

  function setGridDimension(key: "columns" | "rows", val: number) {
    onChange({ ...value, layout: { ...value.layout, [key]: val } });
  }

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={TABS} active={tab} onChange={switchTab} />

      {tab === "display" && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Label"
            value={value.label}
            placeholder="Layout 1"
            onChange={(label) => onChange({ ...value, label })}
          />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-400">Layout type</span>
            <div className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200">
              Grid
            </div>
          </div>

          <SliderRow
            label="Columns (x)"
            value={value.layout.columns}
            min={1} max={12} step={1}
            display={`${value.layout.columns}`}
            onChange={(v) => setGridDimension("columns", v)}
          />
          <SliderRow
            label="Rows (y)"
            value={value.layout.rows}
            min={1} max={12} step={1}
            display={`${value.layout.rows}`}
            onChange={(v) => setGridDimension("rows", v)}
          />
        </div>
      )}

      {tab === "visuals" && (
        <div className="flex flex-col gap-4">
          <SliderRow
            label="Corner radius"
            value={value.borderRadius ?? 0}
            min={0} max={48} step={1}
            display={`${value.borderRadius ?? 0}px`}
            onChange={(borderRadius) => onChange({ ...value, borderRadius })}
          />

          <Divider />

          <SliderRow
            label="Padding"
            value={value.padding}
            min={0} max={64} step={2}
            display={`${value.padding}px`}
            onChange={(padding) => onChange({ ...value, padding })}
          />
          <SliderRow
            label="Gap"
            value={value.gap}
            min={0} max={64} step={2}
            display={`${value.gap}px`}
            onChange={(gap) => onChange({ ...value, gap })}
          />
          <SliderRow
            label="Margin"
            value={value.margin}
            min={0} max={128} step={2}
            display={`${value.margin}px`}
            onChange={(margin) => onChange({ ...value, margin })}
          />

          <Divider />

          <Field label="Background color">
            <Swatch
              value={value.bgColor ?? "#ffffff"}
              onChange={(bgColor) => onChange({ ...value, bgColor })}
            />
          </Field>
          <SliderRow
            label="Background opacity"
            value={value.bgOpacity ?? 3}
            min={0} max={100} step={1}
            display={`${value.bgOpacity ?? 3}%`}
            onChange={(bgOpacity) => onChange({ ...value, bgOpacity })}
          />

          <Divider />

          <Field label="Border color">
            <Swatch
              value={value.borderColor ?? "#ffffff"}
              onChange={(borderColor) => onChange({ ...value, borderColor })}
            />
          </Field>
          <SliderRow
            label="Border opacity"
            value={value.borderOpacity ?? 6}
            min={0} max={100} step={1}
            display={`${value.borderOpacity ?? 6}%`}
            onChange={(borderOpacity) => onChange({ ...value, borderOpacity })}
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
