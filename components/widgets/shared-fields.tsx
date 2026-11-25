"use client";

import { useState } from "react";
import { Divider, Field, Label, NumberInput, Select, SliderRow, Swatch, Toggle } from "@/components/ui";
import { parse, stringify } from "@/lib/yaml-parser";
import {
  SPACING_SIDES,
  isUniform,
  resolveSpacing,
  uniformSpacing,
  type Spacing,
  type SpacingValue,
} from "@/types/spacing";
import {
  resolveEdgeShadow,
  type EdgeShadowConfig,
  type EdgeShadowEdges,
} from "@/types/edge-shadow";

/** Tabs every container widget editor uses, in the same order. */
export type ContainerTab = "display" | "visuals" | "yaml" | "permissions";

export const CONTAINER_TABS: { id: ContainerTab; label: string }[] = [
  { id: "display",     label: "Display"     },
  { id: "visuals",     label: "Visuals"     },
  { id: "yaml",        label: "YAML"        },
  { id: "permissions", label: "Permissions" },
];

const SIDE_LABELS: Record<(typeof SPACING_SIDES)[number], string> = {
  top: "Top",
  right: "Right",
  bottom: "Bottom",
  left: "Left",
};

// ─── Spacing ──────────────────────────────────────────────────────────────────

interface SpacingFieldsProps {
  label: string;
  value: Spacing;
  onChange: (v: Spacing) => void;
}

/** One typed value for all sides, or split into top / right / bottom / left. No upper limit. */
export function SpacingFields({ label, value, onChange }: SpacingFieldsProps) {
  const [linked, setLinked] = useState(() => isUniform(value));

  return (
    <div className="flex flex-col gap-2" data-spacing-field={label}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => {
            if (!linked) onChange(uniformSpacing(value.top));
            setLinked(!linked);
          }}
          className="text-[11px] font-medium text-fg-subtle hover:text-fg-muted transition-colors"
        >
          {linked ? "Set sides separately" : "Same on all sides"}
        </button>
      </div>
      {linked ? (
        <NumberInput
          label="All sides"
          value={value.top}
          onChange={(n) => onChange(uniformSpacing(n))}
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {SPACING_SIDES.map((side) => (
            <NumberInput
              key={side}
              label={SIDE_LABELS[side]}
              value={value[side]}
              onChange={(n) => onChange({ ...value, [side]: n })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Background & border colors ───────────────────────────────────────────────

export interface BoxColors {
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderOpacity: number;
}

export function BoxColorFields({ value, onChange }: { value: BoxColors; onChange: (v: BoxColors) => void }) {
  return (
    <>
      <Field label="Background color">
        <Swatch value={value.bgColor} onChange={(bgColor) => onChange({ ...value, bgColor })} />
      </Field>
      <SliderRow
        label="Background opacity"
        value={value.bgOpacity}
        min={0} max={100} step={1}
        display={`${value.bgOpacity}%`}
        onChange={(bgOpacity) => onChange({ ...value, bgOpacity })}
      />

      <Divider />

      <Field label="Border color">
        <Swatch value={value.borderColor} onChange={(borderColor) => onChange({ ...value, borderColor })} />
      </Field>
      <SliderRow
        label="Border opacity"
        value={value.borderOpacity}
        min={0} max={100} step={1}
        display={`${value.borderOpacity}%`}
        onChange={(borderOpacity) => onChange({ ...value, borderOpacity })}
      />
    </>
  );
}

// ─── Edge shadow ──────────────────────────────────────────────────────────────

interface EdgeShadowFieldsProps {
  value: EdgeShadowConfig | undefined;
  /** What "Auto" means for this widget, shown in its option label. */
  autoHint: string;
  onChange: (v: EdgeShadowConfig) => void;
}

export function EdgeShadowFields({ value, autoHint, onChange }: EdgeShadowFieldsProps) {
  const shadow = resolveEdgeShadow(value);
  const edgeOptions: { label: string; value: EdgeShadowEdges }[] = [
    { label: `Auto (${autoHint})`, value: "auto" },
    { label: "Left & right", value: "horizontal" },
    { label: "Top & bottom", value: "vertical" },
    { label: "All edges", value: "all" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Toggle
        label="Edge shadow"
        checked={shadow.enabled}
        onChange={(enabled) => onChange({ ...shadow, enabled })}
      />
      {shadow.enabled && (
        <>
          <Select
            label="Edges"
            value={shadow.edges}
            options={edgeOptions}
            onChange={(edges) => onChange({ ...shadow, edges: edges as EdgeShadowEdges })}
          />
          <div className="grid grid-cols-2 gap-x-3">
            <NumberInput
              label="Full strength until"
              value={shadow.solidSize ?? 0}
              onChange={(solidSize) => onChange({ ...shadow, solidSize })}
            />
            <NumberInput
              label="Faded out at"
              value={shadow.size}
              onChange={(size) => onChange({ ...shadow, size })}
            />
          </div>
          <p className="text-[11px] text-fg-subtle leading-snug -mt-2">
            Measured in from the edge. The shadow is at full strength up to the first depth, then fades to clear by the second.
          </p>
          {shadow.edges !== "horizontal" && (
            <NumberInput
              label="Top & bottom faded out at"
              value={shadow.verticalSize ?? shadow.size}
              onChange={(verticalSize) => onChange({ ...shadow, verticalSize })}
            />
          )}
          <Field label="Shadow color">
            <Swatch value={shadow.color} onChange={(color) => onChange({ ...shadow, color })} />
          </Field>
          <SliderRow
            label="Shadow strength"
            value={shadow.opacity}
            min={0} max={100} step={1}
            display={`${shadow.opacity}%`}
            onChange={(opacity) => onChange({ ...shadow, opacity })}
          />
        </>
      )}
    </div>
  );
}

// ─── Container visuals (layouts and menus) ────────────────────────────────────

/** The visual settings layouts and menus share. */
export interface ContainerVisuals {
  margin: SpacingValue;
  padding: SpacingValue;
  gap: number;
  borderRadius: number;
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderOpacity: number;
  edgeShadow?: EdgeShadowConfig;
}

interface ContainerVisualsFieldsProps<T extends ContainerVisuals> {
  value: T;
  /** Fallbacks for fields an older config left out. */
  defaults: ContainerVisuals;
  /** What edge shadow "Auto" means for this widget. */
  shadowAutoHint: string;
  onChange: (v: T) => void;
}

/**
 * The Visuals tab for layouts and menus. Both get the same controls in the
 * same order: spacing, shape, colors, then edge shadow.
 */
export function ContainerVisualsFields<T extends ContainerVisuals>({
  value,
  defaults,
  shadowAutoHint,
  onChange,
}: ContainerVisualsFieldsProps<T>) {
  const margin = resolveSpacing(value.margin, resolveSpacing(defaults.margin).top);
  const padding = resolveSpacing(value.padding, resolveSpacing(defaults.padding).top);
  const colors: BoxColors = {
    bgColor: value.bgColor ?? defaults.bgColor,
    bgOpacity: value.bgOpacity ?? defaults.bgOpacity,
    borderColor: value.borderColor ?? defaults.borderColor,
    borderOpacity: value.borderOpacity ?? defaults.borderOpacity,
  };
  const gap = value.gap ?? defaults.gap;
  const radius = value.borderRadius ?? defaults.borderRadius;

  return (
    <div className="flex flex-col gap-4">
      <SpacingFields label="Margin" value={margin} onChange={(m) => onChange({ ...value, margin: m })} />
      <SpacingFields label="Padding" value={padding} onChange={(p) => onChange({ ...value, padding: p })} />
      <NumberInput label="Gap" value={gap} onChange={(g) => onChange({ ...value, gap: g })} />

      <Divider />

      <SliderRow
        label="Corner radius"
        value={radius}
        min={0} max={48} step={1}
        display={`${radius}px`}
        onChange={(borderRadius) => onChange({ ...value, borderRadius })}
      />

      <Divider />

      <BoxColorFields value={colors} onChange={(c) => onChange({ ...value, ...c })} />

      <Divider />

      <EdgeShadowFields
        value={value.edgeShadow}
        autoHint={shadowAutoHint}
        onChange={(edgeShadow) => onChange({ ...value, edgeShadow })}
      />
    </div>
  );
}

// ─── YAML ─────────────────────────────────────────────────────────────────────

interface YamlTabProps<T> {
  value: T;
  /** Turn parsed YAML into a config that renders, or null to reject it. */
  normalize: (parsed: unknown) => T | null;
  onChange: (v: T) => void;
}

/**
 * Edit the config as YAML. Keeps the text in step when the config changes from
 * somewhere else (Revert, another tab) but not while you're typing in it.
 */
export function YamlTab<T>({ value, normalize, onChange }: YamlTabProps<T>) {
  const [text, setText] = useState(() => stringify(value));
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(value);
  const [emitted, setEmitted] = useState<T | null>(null);

  if (value !== synced) {
    setSynced(value);
    if (value !== emitted) {
      setText(stringify(value));
      setError(null);
    }
  }

  function handleChange(next: string) {
    setText(next);
    try {
      const config = normalize(parse<unknown>(next));
      if (!config) {
        setError("Expected a YAML mapping (key: value pairs)");
        return;
      }
      setEmitted(config);
      onChange(config);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid YAML");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
        aria-label="YAML"
        className="w-full h-56 font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-xl p-3 border border-zinc-800 resize-none focus:outline-none focus:ring-1 focus:ring-brand/40"
      />
      {error && (
        <div className="flex gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-xs shrink-0 mt-px">⚠</span>
          <p className="text-xs text-red-400 font-mono leading-snug break-all">{error}</p>
        </div>
      )}
    </div>
  );
}
