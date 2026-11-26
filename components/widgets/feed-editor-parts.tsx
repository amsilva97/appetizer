"use client";

import type { ReactNode } from "react";
import type { StyleCase, StyleRule } from "@/types/feed";
import { removeAt, replaceAt } from "@/lib/feed/list-edit";

/** Small building blocks shared by the feed editor sections. */

const INPUT =
  "w-full min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 " +
  "placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand/40";

const CODE =
  "w-full font-mono text-[11px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-lg p-2.5 " +
  "border border-zinc-800 resize-y focus:outline-none focus:ring-1 focus:ring-brand/40";

const ICON_BUTTON = "px-1.5 py-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none";

export function SectionHeader({ title, hint, onAdd, addLabel = "+ Add" }: {
  title: string;
  hint?: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        {onAdd && (
          <button
            onClick={onAdd}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
          >
            {addLabel}
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-zinc-600 leading-snug">{hint}</p>}
    </div>
  );
}

/** A bordered card for one entry of a reorderable list, with move and remove buttons. */
export function ListCard({ title, index, count, onMove, onRemove, children }: {
  title: ReactNode;
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2.5">
      <div className="flex items-center gap-1">
        <span className="flex-1 min-w-0 truncate text-[11px] font-medium text-zinc-300">{title}</span>
        <button aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className={ICON_BUTTON}>↑</button>
        <button aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)} className={ICON_BUTTON}>↓</button>
        <button aria-label="Remove" onClick={onRemove} className={`${ICON_BUTTON} hover:!text-red-400`}>✕</button>
      </div>
      {children}
    </div>
  );
}

export function SmallInput({ label, value, placeholder, onChange }: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT} />
    </label>
  );
}

export function SmallSelect<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={INPUT}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function CodeBox({ label, value, placeholder, rows = 3, onChange }: {
  label?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-[10px] text-zinc-500">{label}</span>}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className={CODE}
      />
    </label>
  );
}

/** Base CSS plus an optional switch: "when <key> is <value>, add <css>". */
export function StyleRuleFields({ label, value, onChange }: {
  label: string;
  value: StyleRule | undefined;
  onChange: (v: StyleRule) => void;
}) {
  const rule: StyleRule = value ?? { base: "" };
  const cases = rule.cases ?? [];
  const setCases = (next: StyleCase[]) => onChange({ ...rule, cases: next });

  return (
    <div className="flex flex-col gap-1.5">
      <CodeBox label={`${label} CSS`} value={rule.base} rows={1} placeholder="color: #a1a1aa; font-size: 10px" onChange={(base) => onChange({ ...rule, base })} />
      <SmallInput
        label={`${label}: switch on key (optional)`}
        value={rule.switchKey ?? ""}
        placeholder="e.g. state"
        onChange={(switchKey) => onChange({ ...rule, switchKey: switchKey || undefined })}
      />
      {rule.switchKey && (
        <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-zinc-800">
          {cases.map((c, i) => (
            <div key={i} className="flex gap-1.5 items-end">
              <div className="w-1/3"><SmallInput label="when" value={c.equals} placeholder="pending" onChange={(equals) => setCases(replaceAt(cases, i, { ...c, equals }))} /></div>
              <div className="flex-1"><SmallInput label="add CSS" value={c.style} placeholder="color: #fbbf24" onChange={(style) => setCases(replaceAt(cases, i, { ...c, style }))} /></div>
              <button aria-label="Remove case" onClick={() => setCases(removeAt(cases, i))} className={`${ICON_BUTTON} mb-1`}>✕</button>
            </div>
          ))}
          <button onClick={() => setCases([...cases, { equals: "", style: "" }])} className="self-start text-[11px] text-zinc-500 hover:text-zinc-300">
            + Add case
          </button>
        </div>
      )}
    </div>
  );
}
