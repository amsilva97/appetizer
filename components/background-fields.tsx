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

interface Props {
  value: BackgroundConfig;
  onChange: (value: BackgroundConfig) => void;
}

const ALL_TYPES = [
  "solid", "gradient", "wavy", "aurora", "particles",
  "mesh", "conic", "plasma", "bokeh", "geometric",
] as const;

export default function BackgroundFields({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <PresetPicker onChange={onChange} />
      <TypeSelector value={value} onChange={onChange} />
      <div className="flex flex-col gap-3">
        {value.type === "solid" && <SolidFields value={value} onChange={onChange} />}
        {value.type === "gradient" && <GradientFields value={value} onChange={onChange} />}
        {value.type === "wavy" && <WavyFields value={value} onChange={onChange} />}
        {value.type === "aurora" && <AuroraFields value={value} onChange={onChange} />}
        {value.type === "particles" && <ParticlesFields value={value} onChange={onChange} />}
        {value.type === "mesh" && <MeshFields value={value} onChange={onChange} />}
        {value.type === "conic" && <ConicFields value={value} onChange={onChange} />}
        {value.type === "plasma" && <PlasmaFields value={value} onChange={onChange} />}
        {value.type === "bokeh" && <BokehFields value={value} onChange={onChange} />}
        {value.type === "geometric" && <GeometricFields value={value} onChange={onChange} />}
      </div>
      <OverlayFields value={value} onChange={onChange} />
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{children}</p>
  );
}

function SliderRow({
  label, value, min, max, step = 1, display, leftLabel, rightLabel, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  leftLabel?: string;
  rightLabel?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {leftLabel && <span className="text-xs text-gray-400 w-7">{leftLabel}</span>}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
        />
        {rightLabel && <span className="text-xs text-gray-400 w-7">{rightLabel}</span>}
        {display !== undefined && (
          <span className="text-sm font-mono w-12 text-right">{display}</span>
        )}
      </div>
    </div>
  );
}

function Swatch({
  label, value, onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer border"
      />
      {label && <span className="text-sm">{label}</span>}
      <span className="text-xs text-gray-400 font-mono">{value}</span>
    </label>
  );
}

function SpeedRow({
  value, onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <SliderRow
      label="Speed"
      value={value}
      min={1}
      max={10}
      leftLabel="slow"
      rightLabel="fast"
      onChange={onChange}
    />
  );
}

function ColorList({
  colors,
  min = 2,
  max = 6,
  labelPrefix = "Color",
  onChange,
}: {
  colors: string[];
  min?: number;
  max?: number;
  labelPrefix?: string;
  onChange: (colors: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {colors.map((color, i) => (
        <div key={i} className="flex items-center gap-2">
          <Swatch
            label={`${labelPrefix} ${i + 1}`}
            value={color}
            onChange={(c) => onChange(colors.map((v, idx) => (idx === i ? c : v)))}
          />
          {colors.length > min && (
            <button
              onClick={() => onChange(colors.filter((_, idx) => idx !== i))}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {colors.length < max && (
        <button
          onClick={() => onChange([...colors, "#ffffff"])}
          className="text-xs text-left text-gray-400 hover:text-black mt-1"
        >
          + Add
        </button>
      )}
    </div>
  );
}

// ─── Preset picker ────────────────────────────────────────────────────────────

function PresetPicker({ onChange }: { onChange: (v: BackgroundConfig) => void }) {
  return (
    <div>
      <Label>Preset</Label>
      <select
        value=""
        onChange={(e) => {
          const preset = BACKGROUND_PRESETS[e.target.value];
          if (preset) onChange(preset);
        }}
        className="w-full px-2 py-1.5 text-sm border rounded bg-white"
      >
        <option value="">— apply a preset —</option>
        {Object.keys(BACKGROUND_PRESETS).map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Type selector ────────────────────────────────────────────────────────────

function TypeSelector({ value, onChange }: Props) {
  return (
    <div>
      <Label>Type</Label>
      <div className="grid grid-cols-5 gap-1">
        {ALL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => value.type !== type && onChange(DEFAULT_BY_TYPE[type])}
            className={`px-2 py-1 text-xs rounded border capitalize ${
              value.type === type
                ? "bg-black text-white border-black"
                : "hover:bg-black/5"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Type-specific fields ─────────────────────────────────────────────────────

function SolidFields({ value, onChange }: { value: SolidConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <div>
      <Label>Color</Label>
      <Swatch value={value.color} onChange={(color) => onChange({ ...value, color })} />
    </div>
  );
}

function GradientFields({ value, onChange }: { value: GradientConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <SliderRow
        label="Direction"
        value={value.direction}
        min={0}
        max={360}
        display={`${value.direction}°`}
        onChange={(direction) => onChange({ ...value, direction })}
      />
      <div>
        <Label>Colors</Label>
        <ColorList
          colors={value.colors}
          onChange={(colors) => onChange({ ...value, colors })}
          labelPrefix="Stop"
        />
      </div>
      <div>
        <Label>Animated</Label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.animated ?? false}
            onChange={(e) => onChange({ ...value, animated: e.target.checked })}
          />
          <span className="text-sm">Shift colors over time</span>
        </label>
        {value.animated && (
          <div className="mt-2">
            <SpeedRow value={value.speed ?? 5} onChange={(speed) => onChange({ ...value, speed })} />
          </div>
        )}
      </div>
    </>
  );
}

function WavyFields({ value, onChange }: { value: WavyConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <div>
        <Label>Colors</Label>
        <div className="flex flex-col gap-1">
          <Swatch label="Base" value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
          <Swatch label="Wave" value={value.waveColor} onChange={(waveColor) => onChange({ ...value, waveColor })} />
        </div>
      </div>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Amplitude" value={value.amplitude} min={10} max={100} display={`${value.amplitude}px`} onChange={(amplitude) => onChange({ ...value, amplitude })} />
      <SliderRow label="Layers" value={value.layers} min={2} max={5} display={`${value.layers}`} onChange={(layers) => onChange({ ...value, layers })} />
    </>
  );
}

function AuroraFields({ value, onChange }: { value: AuroraConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <div>
        <Label>Base color</Label>
        <Swatch value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
      </div>
      <div>
        <Label>Blob colors</Label>
        <ColorList
          colors={value.colors}
          min={2}
          max={5}
          labelPrefix="Blob"
          onChange={(colors) => onChange({ ...value, colors })}
        />
      </div>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Blur" value={value.blur} min={40} max={120} display={`${value.blur}px`} onChange={(blur) => onChange({ ...value, blur })} />
    </>
  );
}

function ParticlesFields({ value, onChange }: { value: ParticlesConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <div>
        <Label>Colors</Label>
        <div className="flex flex-col gap-1">
          <Swatch label="Background" value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
          <Swatch label="Particles" value={value.particleColor} onChange={(particleColor) => onChange({ ...value, particleColor })} />
        </div>
      </div>
      <SliderRow label="Count" value={value.count} min={10} max={200} display={`${value.count}`} onChange={(count) => onChange({ ...value, count })} />
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Size" value={value.size} min={1} max={5} step={0.5} display={`${value.size}px`} onChange={(size) => onChange({ ...value, size })} />
      <div>
        <Label>Connections</Label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={value.connected} onChange={(e) => onChange({ ...value, connected: e.target.checked })} />
          <span className="text-sm">Draw lines between nearby particles</span>
        </label>
      </div>
    </>
  );
}

function MeshFields({ value, onChange }: { value: MeshConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <div>
        <Label>Base color</Label>
        <Swatch value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
      </div>
      <div>
        <Label>Node colors</Label>
        <ColorList
          colors={value.colors}
          min={3}
          max={6}
          onChange={(colors) => onChange({ ...value, colors })}
        />
      </div>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
    </>
  );
}

function ConicFields({ value, onChange }: { value: ConicConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <div>
        <Label>Colors</Label>
        <ColorList
          colors={value.colors}
          min={2}
          max={8}
          onChange={(colors) => onChange({ ...value, colors })}
        />
      </div>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <div>
        <Label>Direction</Label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={value.reverse} onChange={(e) => onChange({ ...value, reverse: e.target.checked })} />
          <span className="text-sm">Reverse spin</span>
        </label>
      </div>
    </>
  );
}

function PlasmaFields({ value, onChange }: { value: PlasmaConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <SliderRow label="Hue start" value={value.hueStart} min={0} max={360} display={`${value.hueStart}°`} onChange={(hueStart) => onChange({ ...value, hueStart })} />
      <SliderRow label="Hue range" value={value.hueRange} min={30} max={360} display={`${value.hueRange}°`} onChange={(hueRange) => onChange({ ...value, hueRange })} />
      <SliderRow label="Saturation" value={value.saturation} min={0.3} max={1} step={0.05} display={`${Math.round(value.saturation * 100)}%`} onChange={(saturation) => onChange({ ...value, saturation })} />
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Scale" value={value.scale} min={5} max={40} display={`${value.scale}`} onChange={(scale) => onChange({ ...value, scale })} />
    </>
  );
}

function BokehFields({ value, onChange }: { value: BokehConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <div>
        <Label>Base color</Label>
        <Swatch value={value.baseColor} onChange={(baseColor) => onChange({ ...value, baseColor })} />
      </div>
      <div>
        <Label>Circle colors</Label>
        <ColorList
          colors={value.colors}
          min={2}
          max={6}
          onChange={(colors) => onChange({ ...value, colors })}
        />
      </div>
      <SliderRow label="Count" value={value.count} min={5} max={25} display={`${value.count}`} onChange={(count) => onChange({ ...value, count })} />
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Max size" value={value.size} min={50} max={300} display={`${value.size}px`} onChange={(size) => onChange({ ...value, size })} />
    </>
  );
}

function GeometricFields({ value, onChange }: { value: GeometricConfig; onChange: (v: BackgroundConfig) => void }) {
  return (
    <>
      <div>
        <Label>Palette</Label>
        <div className="flex flex-col gap-1">
          <Swatch label="Background" value={value.baseColor ?? "#050d14"} onChange={(baseColor) => onChange({ ...value, baseColor })} />
          <ColorList
            colors={value.colors}
            min={2}
            max={5}
            onChange={(colors) => onChange({ ...value, colors })}
          />
        </div>
      </div>
      <SpeedRow value={value.speed} onChange={(speed) => onChange({ ...value, speed })} />
      <SliderRow label="Cell size" value={value.cellSize} min={40} max={200} display={`${value.cellSize}px`} onChange={(cellSize) => onChange({ ...value, cellSize })} />
    </>
  );
}

// ─── Overlays ─────────────────────────────────────────────────────────────────

function OverlayFields({ value, onChange }: Props) {
  const grain = value.grain ?? 0;
  const vignette = value.vignette ?? 0;
  return (
    <div className="border-t pt-3 flex flex-col gap-3">
      <Label>Overlays</Label>
      <SliderRow
        label="Grain"
        value={grain}
        min={0}
        max={0.5}
        step={0.01}
        display={grain > 0 ? `${Math.round(grain * 100)}%` : "off"}
        onChange={(g) => onChange({ ...value, grain: g } as BackgroundConfig)}
      />
      <SliderRow
        label="Vignette"
        value={vignette}
        min={0}
        max={1}
        step={0.01}
        display={vignette > 0 ? `${Math.round(vignette * 100)}%` : "off"}
        onChange={(v) => onChange({ ...value, vignette: v } as BackgroundConfig)}
      />
    </div>
  );
}
