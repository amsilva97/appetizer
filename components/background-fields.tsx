"use client";

import type {
  AuroraConfig,
  BackgroundConfig,
  BokehConfig,
  ConicConfig,
  GeometricConfig,
  GradientConfig,
  MeshConfig,
  ParticlesConfig,
  PlasmaConfig,
  SolidConfig,
  WavyConfig,
} from "@/types/background";
import { BACKGROUND_PRESETS, DEFAULT_BY_TYPE } from "@/lib/background-presets";
import {
  Label, Field, Select, SliderRow, Swatch, ColorList, Toggle, Divider,
} from "@/components/ui";

interface Props {
  value: BackgroundConfig;
  onChange: (value: BackgroundConfig) => void;
}

const ALL_TYPES = [
  "solid", "gradient", "wavy", "aurora", "particles",
  "mesh", "conic", "plasma", "bokeh", "geometric",
] as const;

const PRESET_OPTIONS = Object.keys(BACKGROUND_PRESETS).map((name) => ({
  label: name,
  value: name,
}));

const TYPE_OPTIONS = ALL_TYPES.map((t) => ({
  label: t.charAt(0).toUpperCase() + t.slice(1),
  value: t,
}));

export default function BackgroundFields({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">

      {/* Preset */}
      <Select
        label="Preset"
        value=""
        options={PRESET_OPTIONS}
        placeholder="— choose a preset —"
        onChange={(name) => {
          const preset = BACKGROUND_PRESETS[name];
          if (preset) onChange(preset);
        }}
      />

      {/* Type */}
      <Select
        label="Type"
        value={value.type}
        options={TYPE_OPTIONS}
        onChange={(type) => {
          const t = type as typeof ALL_TYPES[number];
          if (value.type !== t) onChange(DEFAULT_BY_TYPE[t]);
        }}
      />

      {/* Type-specific fields */}
      <div className="flex flex-col gap-5">
        {value.type === "solid"     && <SolidFields     value={value} onChange={onChange} />}
        {value.type === "gradient"  && <GradientFields  value={value} onChange={onChange} />}
        {value.type === "wavy"      && <WavyFields      value={value} onChange={onChange} />}
        {value.type === "aurora"    && <AuroraFields    value={value} onChange={onChange} />}
        {value.type === "particles" && <ParticlesFields value={value} onChange={onChange} />}
        {value.type === "mesh"      && <MeshFields      value={value} onChange={onChange} />}
        {value.type === "conic"     && <ConicFields     value={value} onChange={onChange} />}
        {value.type === "plasma"    && <PlasmaFields    value={value} onChange={onChange} />}
        {value.type === "bokeh"     && <BokehFields     value={value} onChange={onChange} />}
        {value.type === "geometric" && <GeometricFields value={value} onChange={onChange} />}
      </div>

      {/* Overlays */}
      <Divider />
      <div className="flex flex-col gap-5">
        <Label>Overlays</Label>
        <SliderRow
          label="Grain"
          value={value.grain ?? 0}
          min={0} max={0.5} step={0.01}
          display={
            (value.grain ?? 0) > 0
              ? `${Math.round((value.grain ?? 0) * 100)}%`
              : "off"
          }
          onChange={(g) => onChange({ ...value, grain: g } as BackgroundConfig)}
        />
        <SliderRow
          label="Vignette"
          value={value.vignette ?? 0}
          min={0} max={1} step={0.01}
          display={
            (value.vignette ?? 0) > 0
              ? `${Math.round((value.vignette ?? 0) * 100)}%`
              : "off"
          }
          onChange={(v) => onChange({ ...value, vignette: v } as BackgroundConfig)}
        />
      </div>

    </div>
  );
}

// ─── Type-specific field groups ───────────────────────────────────────────────

function SpeedRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <SliderRow
      label="Speed"
      value={value} min={1} max={10}
      leftLabel="slow" rightLabel="fast"
      onChange={onChange}
    />
  );
}

function SolidFields({ value, onChange }: { value: SolidConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <Field label="Color">
      <Swatch value={value.color} onChange={(color) => onChange({ ...value, color })} />
    </Field>
  );
}

function GradientFields({ value, onChange }: { value: GradientConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <SliderRow
        label="Direction" value={value.direction} min={0} max={360}
        display={`${value.direction}°`}
        onChange={(direction) => onChange({ ...value, direction })}
      />
      <Field label="Colors">
        <ColorList
          colors={value.colors} labelPrefix="Stop"
          onChange={(colors) => onChange({ ...value, colors })}
        />
      </Field>
      <Field label="Animate">
        <Toggle
          checked={value.animated ?? false}
          label="Shift colors over time"
          onChange={(animated) => onChange({ ...value, animated })}
        />
        {value.animated && (
          <div className="mt-3">
            <SpeedRow value={value.speed ?? 5} onChange={(speed) => onChange({ ...value, speed })} />
          </div>
        )}
      </Field>
    </>
  );
}

function WavyFields({ value, onChange }: { value: WavyConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <Field label="Colors">
        <Swatch label="Base" value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
        <Swatch label="Wave" value={value.waveColor} onChange={(waveColor) => onChange({ ...value, waveColor })} />
      </Field>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Amplitude" value={value.amplitude} min={10} max={100} display={`${value.amplitude}px`} onChange={(amplitude) => onChange({ ...value, amplitude })} />
      <SliderRow label="Layers"    value={value.layers}    min={2}  max={5}   display={`${value.layers}`}       onChange={(layers)    => onChange({ ...value, layers })} />
    </>
  );
}

function AuroraFields({ value, onChange }: { value: AuroraConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <Field label="Base color">
        <Swatch value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
      </Field>
      <Field label="Blob colors">
        <ColorList colors={value.colors} min={2} max={5} labelPrefix="Blob" onChange={(colors) => onChange({ ...value, colors })} />
      </Field>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Blur" value={value.blur} min={40} max={120} display={`${value.blur}px`} onChange={(blur) => onChange({ ...value, blur })} />
    </>
  );
}

function ParticlesFields({ value, onChange }: { value: ParticlesConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <Field label="Colors">
        <Swatch label="Background" value={value.baseColor}      onChange={(baseColor)      => onChange({ ...value, baseColor })} />
        <Swatch label="Particles"  value={value.particleColor}  onChange={(particleColor)  => onChange({ ...value, particleColor })} />
      </Field>
      <SliderRow label="Count" value={value.count} min={10} max={200} display={`${value.count}`}    onChange={(count) => onChange({ ...value, count })} />
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Size"  value={value.size}  min={1}  max={5}   step={0.5} display={`${value.size}px`} onChange={(size)  => onChange({ ...value, size })} />
      <Field label="Connections">
        <Toggle checked={value.connected} label="Draw lines between nearby particles" onChange={(connected) => onChange({ ...value, connected })} />
      </Field>
    </>
  );
}

function MeshFields({ value, onChange }: { value: MeshConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <Field label="Base color">
        <Swatch value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
      </Field>
      <Field label="Node colors">
        <ColorList colors={value.colors} min={3} max={6} onChange={(colors) => onChange({ ...value, colors })} />
      </Field>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
    </>
  );
}

function ConicFields({ value, onChange }: { value: ConicConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <Field label="Colors">
        <ColorList colors={value.colors} min={2} max={8} onChange={(colors) => onChange({ ...value, colors })} />
      </Field>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <Field label="Direction">
        <Toggle checked={value.reverse} label="Reverse spin" onChange={(reverse) => onChange({ ...value, reverse })} />
      </Field>
    </>
  );
}

function PlasmaFields({ value, onChange }: { value: PlasmaConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <SliderRow label="Hue start"  value={value.hueStart}   min={0}   max={360} display={`${value.hueStart}°`}                           onChange={(hueStart)   => onChange({ ...value, hueStart })} />
      <SliderRow label="Hue range"  value={value.hueRange}   min={30}  max={360} display={`${value.hueRange}°`}                           onChange={(hueRange)   => onChange({ ...value, hueRange })} />
      <SliderRow label="Saturation" value={value.saturation} min={0.3} max={1}   step={0.05} display={`${Math.round(value.saturation * 100)}%`} onChange={(saturation) => onChange({ ...value, saturation })} />
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Scale" value={value.scale} min={5} max={40} display={`${value.scale}`} onChange={(scale) => onChange({ ...value, scale })} />
    </>
  );
}

function BokehFields({ value, onChange }: { value: BokehConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <Field label="Base color">
        <Swatch value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
      </Field>
      <Field label="Circle colors">
        <ColorList colors={value.colors} min={2} max={6} onChange={(colors) => onChange({ ...value, colors })} />
      </Field>
      <SliderRow label="Count"    value={value.count} min={5}  max={25}  display={`${value.count}`}  onChange={(count) => onChange({ ...value, count })} />
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Max size" value={value.size}  min={50} max={300} display={`${value.size}px`} onChange={(size)  => onChange({ ...value, size })} />
    </>
  );
}

function GeometricFields({ value, onChange }: { value: GeometricConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <Field label="Palette">
        <Swatch label="Background" value={value.baseColor ?? "#050d14"} onChange={(baseColor) => onChange({ ...value, baseColor })} />
        <ColorList colors={value.colors} min={2} max={5} onChange={(colors) => onChange({ ...value, colors })} />
      </Field>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Cell size" value={value.cellSize} min={40} max={200} display={`${value.cellSize}px`} onChange={(cellSize) => onChange({ ...value, cellSize })} />
    </>
  );
}
