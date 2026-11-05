"use client";

// ─── Typography ───────────────────────────────────────────────────────────────

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 leading-none">
      {children}
    </p>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── Shared input class ───────────────────────────────────────────────────────

const BASE_INPUT =
  "w-full h-9 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg " +
  "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/[0.08] " +
  "focus:border-zinc-500 transition-colors";

// ─── Text input ───────────────────────────────────────────────────────────────

export function TextInput({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={BASE_INPUT}
      />
    </Field>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

export function TextArea({
  label,
  value,
  placeholder,
  rows = 3,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value ?? ""}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/[0.08] focus:border-zinc-500 transition-colors resize-none leading-relaxed"
      />
    </Field>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function Select({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const control = (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 appearance-none pl-3 pr-9 text-sm text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/[0.08] focus:border-zinc-500 transition-colors"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
        <ChevronDown />
      </span>
    </div>
  );

  return label ? <Field label={label}>{control}</Field> : control;
}

// ─── Slider ───────────────────────────────────────────────────────────────────

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  leftLabel,
  rightLabel,
  onChange,
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {display !== undefined && (
          <span className="text-[11px] font-mono text-zinc-400 leading-none">{display}</span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        {leftLabel && (
          <span className="text-[10px] text-zinc-600 w-7 shrink-0">{leftLabel}</span>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 cursor-pointer accent-zinc-300"
        />
        {rightLabel && (
          <span className="text-[10px] text-zinc-600 w-7 shrink-0 text-right">{rightLabel}</span>
        )}
      </div>
    </div>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

export function Swatch({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className="w-7 h-7 rounded-lg ring-1 ring-white/[0.1] shrink-0 overflow-hidden relative"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      {label && (
        <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
          {label}
        </span>
      )}
      <span className="text-[11px] font-mono text-zinc-600 ml-auto">{value}</span>
    </label>
  );
}

// ─── Color list ───────────────────────────────────────────────────────────────

export function ColorList({
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
    <div className="flex flex-col gap-2.5">
      {colors.map((color, i) => (
        <div key={i} className="group flex items-center gap-1.5">
          <Swatch
            label={`${labelPrefix} ${i + 1}`}
            value={color}
            onChange={(c) => onChange(colors.map((v, idx) => (idx === i ? c : v)))}
          />
          {colors.length > min && (
            <button
              onClick={() => onChange(colors.filter((_, idx) => idx !== i))}
              title="Remove"
              className="ml-1 opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/[0.12] transition-all text-base leading-none shrink-0"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {colors.length < max && (
        <button
          onClick={() => onChange([...colors, "#ffffff"])}
          className="text-xs text-zinc-600 hover:text-zinc-300 text-left transition-colors"
        >
          + Add color
        </button>
      )}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
          checked ? "bg-zinc-200" : "bg-zinc-700"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-4 bg-zinc-900" : "translate-x-0 bg-zinc-400"
          }`}
        />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider() {
  return <div className="border-t border-zinc-800" />;
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-0.5 bg-zinc-800/60 rounded-lg p-0.5 border border-zinc-700/50">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
            active === t.id
              ? "bg-zinc-700 text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
