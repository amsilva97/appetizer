"use client";

import type { MobileSlot, MobileSpan } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig, LogoView } from "@/types/app-widget";
import { phoneAppConfig, showsFeed } from "@/lib/mobile";

const SPAN_LABELS: Record<MobileSpan, string> = { full: "Full", half: "Half", third: "Third" };
const SPAN_OPTIONS: MobileSpan[] = ["full", "half", "third"];

const LOGO_VIEW_LABELS: Record<LogoView, string> = { icon: "Icon", none: "No icon", full: "Full cover", compact: "Compact" };
const LOGO_VIEW_OPTIONS: LogoView[] = ["icon", "none", "full", "compact"];

const cardTitle = (w: WidgetInstance) => (w.config as AppWidgetConfig).title || "App";

function GripIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-zinc-500">
      <circle cx="9" cy="7" r="1" fill="currentColor" />
      <circle cx="15" cy="7" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="17" r="1" fill="currentColor" />
      <circle cx="15" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

// ─── Card in the phone preview ────────────────────────────────────────────────

interface PhoneSlotProps {
  widget: WidgetInstance;
  slot: MobileSlot;
  selected: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onDragStart: () => void;
}

/** A card in the phone preview, as wide as it will be on the phone. Click to edit, drag to reorder. */
export function PhoneSlot({ widget, slot, selected, isDragOver, onSelect, onDragStart }: PhoneSlotProps) {
  const compact = phoneAppConfig(widget.config as AppWidgetConfig, slot).logoView === "compact";
  const tone = selected
    ? "border-brand bg-brand/[0.14]"
    : isDragOver
      ? "border-brand/60 bg-brand/[0.1]"
      : "border-white/[0.08] bg-white/[0.05] hover:border-white/20";
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("slot", widget.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onClick={onSelect}
      title={`${cardTitle(widget)}: click to edit, drag to reorder`}
      className={`flex gap-1.5 px-2 py-2 rounded-xl border transition-all select-none cursor-grab active:cursor-grabbing min-w-0 ${
        compact ? "flex-col items-center justify-center text-center h-16" : "items-center h-11"
      } ${tone}`}
    >
      {compact ? <div className="w-6 h-6 rounded-md bg-white/15 shrink-0" /> : <GripIcon />}
      <p className="flex-1 min-w-0 max-w-full text-[11px] text-zinc-300 truncate">{cardTitle(widget)}</p>
    </div>
  );
}

// ─── Settings for the selected card ───────────────────────────────────────────

interface CardSettingsProps {
  widget: WidgetInstance;
  slot: MobileSlot;
  onChange: (patch: Partial<Omit<MobileSlot, "id">>) => void;
  onRemove: () => void;
}

/** Width and logo view of the selected card, on the phone only. */
export function CardSettings({ widget, slot, onChange, onRemove }: CardSettingsProps) {
  const cfg = widget.config as AppWidgetConfig;
  const feedTakesRow = showsFeed(phoneAppConfig(cfg, slot));
  return (
    <div className="w-64 shrink-0 flex flex-col gap-4 p-4 rounded-2xl border border-white/[0.08] bg-zinc-900/80">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Phone card</p>
        <p className="text-sm font-medium text-zinc-100 truncate mt-1">{cardTitle(widget)}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-zinc-400">Width</p>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-black/30" role="radiogroup" aria-label="Width">
          {SPAN_OPTIONS.map((span) => (
            <button
              key={span}
              type="button"
              role="radio"
              aria-checked={slot.span === span}
              disabled={feedTakesRow}
              onClick={() => onChange({ span })}
              className={`h-7 rounded-md text-xs transition-colors disabled:opacity-40 ${
                slot.span === span ? "bg-brand text-zinc-950 font-semibold" : "text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              {SPAN_LABELS[span]}
            </button>
          ))}
        </div>
        {feedTakesRow && (
          <p className="text-[10px] text-zinc-500">
            This card shows its feed, so it takes the full row. Pick Compact or Full cover below to make it narrower.
          </p>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-400">Logo view on the phone</span>
        <select
          value={slot.logoView ?? ""}
          onChange={(e) => onChange({ logoView: (e.target.value || undefined) as LogoView | undefined })}
          className="h-8 px-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
        >
          <option value="">Same as desktop ({LOGO_VIEW_LABELS[cfg.logoView] ?? cfg.logoView})</option>
          {LOGO_VIEW_OPTIONS.map((v) => <option key={v} value={v}>{LOGO_VIEW_LABELS[v]}</option>)}
        </select>
      </label>

      <button
        type="button"
        onClick={onRemove}
        className="h-8 rounded-lg text-xs text-red-400 border border-red-900/40 hover:bg-red-900/20 transition-colors"
      >
        Remove from phone
      </button>
    </div>
  );
}
