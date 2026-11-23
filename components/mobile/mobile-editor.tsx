"use client";

import { useRef, useState } from "react";
import type { MobileConfig } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { MenuWidgetConfig } from "@/types/menu-widget";
import { resolveMobileSlots, trayWidgets as pickTrayWidgets } from "@/lib/mobile";

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function GripIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="7" r="1" fill="currentColor" />
      <circle cx="15" cy="7" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="17" r="1" fill="currentColor" />
      <circle cx="15" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

const cardTitle = (w: WidgetInstance) => (w.config as AppWidgetConfig).title || "App";

// ─── Tray ─────────────────────────────────────────────────────────────────────

interface TrayItemProps {
  widget: WidgetInstance;
  /** Label of the menu this card sits in on desktop, if any. */
  parentLabel?: string;
  inUse: boolean;
  onAdd: () => void;
}

function TrayItem({ widget, parentLabel, inUse, onAdd }: TrayItemProps) {
  return (
    <div
      draggable={!inUse}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", widget.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onDoubleClick={() => { if (!inUse) onAdd(); }}
      title={inUse ? "Already on the phone" : "Drag onto the phone, or double-click to add"}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors select-none ${
        inUse
          ? "border-brand/40 bg-brand/[0.08] opacity-60 cursor-default"
          : "border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 hover:border-zinc-600 cursor-grab active:cursor-grabbing"
      }`}
    >
      <GripIcon size={14} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-200 truncate">{cardTitle(widget)}</p>
        <p className="text-[10px] text-zinc-500 truncate">{parentLabel ? `In ${parentLabel}` : "Card"}</p>
      </div>
      {inUse && <span className="text-[9px] font-semibold text-brand/70 uppercase tracking-wide shrink-0">added</span>}
    </div>
  );
}

// ─── Phone slot ───────────────────────────────────────────────────────────────

interface PhoneSlotProps {
  widget: WidgetInstance;
  isDragOver: boolean;
  onRemove: () => void;
  onDragStart: () => void;
}

function PhoneSlot({ widget, isDragOver, onRemove, onDragStart }: PhoneSlotProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("slot", widget.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all select-none cursor-grab active:cursor-grabbing ${
        isDragOver ? "border-brand/60 bg-brand/[0.1]" : "border-white/[0.08] bg-white/[0.05]"
      }`}
    >
      <GripIcon size={12} />
      <p className="flex-1 text-xs text-zinc-300 truncate">{cardTitle(widget)}</p>
      <button
        onClick={onRemove}
        title="Remove from phone"
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
      >
        <XIcon size={11} />
      </button>
    </div>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

interface Props {
  /** Label of the page being edited; each page has its own phone version. */
  pageLabel: string;
  mobile: MobileConfig;
  widgets: WidgetInstance[];
  mobileEnabled: boolean;
  onMobileChange: (m: MobileConfig) => void;
  onMobileEnabledChange: (enabled: boolean) => void;
  onClose: () => void;
}

export default function MobileEditor({ pageLabel, mobile, widgets, mobileEnabled, onMobileChange, onMobileEnabledChange, onClose }: Props) {
  const dragFromRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [overEnd, setOverEnd] = useState(false);

  // Only cards that are on this page, each at most once.
  const placed = resolveMobileSlots(mobile.slots ?? [], widgets);
  const placedIds = new Set(placed.map((w) => w.id));
  const tray = pickTrayWidgets(widgets);
  const menuLabel = (id: string | undefined) => {
    const parent = widgets.find((w) => w.id === id && w.type === "menu");
    return parent ? (parent.config as MenuWidgetConfig).label : undefined;
  };

  const setSlots = (slots: string[]) => onMobileChange({ ...mobile, slots });

  function insertAt(id: string, at: number) {
    if (placedIds.has(id) || !tray.some((w) => w.id === id)) return;
    const ids = placed.map((w) => w.id);
    ids.splice(at, 0, id);
    setSlots(ids);
  }

  function moveTo(from: number, to: number) {
    if (from === to) return;
    const ids = placed.map((w) => w.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to > from ? to - 1 : to, 0, moved);
    setSlots(ids);
  }

  /** Drop on a slot (index) or the end zone (placed.length): reorder a phone card or add a tray card there. */
  function handleDrop(e: React.DragEvent, at: number) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIdx(null);
    setOverEnd(false);
    const from = dragFromRef.current;
    dragFromRef.current = null;
    if (from !== null) return moveTo(from, at);
    const id = e.dataTransfer.getData("text/plain");
    if (id) insertAt(id, at);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-sm">
      {/* header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
          <span className="text-sm font-semibold text-zinc-100 truncate">Phone version · {pageLabel}</span>
        </div>

        <label className="flex items-center gap-2 ml-2 cursor-pointer shrink-0" title="Applies to every page">
          <button
            type="button"
            role="switch"
            aria-checked={mobileEnabled}
            onClick={() => onMobileEnabledChange(!mobileEnabled)}
            className={`shrink-0 inline-flex items-center w-9 h-5 px-0.5 rounded-full transition-colors ${mobileEnabled ? "bg-brand" : "bg-zinc-700"}`}
          >
            <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${mobileEnabled ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <span className="text-xs text-zinc-400">{mobileEnabled ? "Phone view on (all pages)" : "Phone view off"}</span>
        </label>

        <div className="flex-1" />

        <button
          onClick={onClose}
          title="Close"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.07] transition-colors"
        >
          <XIcon size={16} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* tray: this page's cards */}
        <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Cards on this page</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Drag onto the phone, or double-click</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {tray.length === 0 && <p className="text-xs text-zinc-600 text-center mt-8">This page has no app cards yet.</p>}
            {tray.map((w) => (
              <TrayItem
                key={w.id}
                widget={w}
                parentLabel={menuLabel(w.parentId)}
                inUse={placedIds.has(w.id)}
                onAdd={() => insertAt(w.id, placed.length)}
              />
            ))}
          </div>
        </div>

        {/* phone */}
        <div className="flex-1 overflow-auto flex flex-col items-center py-8 gap-4">
          <div
            className="relative rounded-[36px] border-[3px] border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/70 flex flex-col overflow-hidden"
            style={{ width: 320, minHeight: 580, maxHeight: 680 }}
          >
            <div className="shrink-0 flex justify-center pt-3 pb-2">
              <div className="w-24 h-5 rounded-full bg-zinc-800" />
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
              {placed.map((w, i) => (
                <div
                  key={w.id}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => handleDrop(e, i)}
                >
                  <PhoneSlot
                    widget={w}
                    isDragOver={dragOverIdx === i}
                    onRemove={() => setSlots(placed.filter((p) => p.id !== w.id).map((p) => p.id))}
                    onDragStart={() => { dragFromRef.current = i; }}
                  />
                </div>
              ))}

              <div
                onDragOver={(e) => { e.preventDefault(); setOverEnd(true); }}
                onDragLeave={() => setOverEnd(false)}
                onDrop={(e) => handleDrop(e, placed.length)}
                className={`flex items-center justify-center h-12 shrink-0 rounded-xl border-2 border-dashed transition-colors text-xs ${
                  overEnd ? "border-brand/60 bg-brand/[0.08] text-brand" : "border-white/10 text-zinc-600"
                }`}
              >
                {overEnd ? "Drop here" : "+ Drag a card here"}
              </div>
            </div>

            <div className="shrink-0 flex justify-center py-2">
              <div className="w-24 h-1 rounded-full bg-zinc-700" />
            </div>
          </div>
          <p className="text-[10px] text-zinc-600">Drag cards on the phone to reorder them</p>
        </div>
      </div>
    </div>
  );
}
