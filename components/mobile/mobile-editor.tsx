"use client";

import { useRef, useState } from "react";
import type { MobileConfig, MobileSlot } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { MenuWidgetConfig } from "@/types/menu-widget";
import {
  PHONE_GRID_COLUMNS,
  insertSlot,
  moveSlot,
  phoneAppConfig,
  phoneColumns,
  removeSlot,
  resolveMobileSlots,
  showsFeed,
  trayWidgets as pickTrayWidgets,
  updateSlot,
} from "@/lib/mobile";
import { CardSettings, PhoneSlot } from "./phone-slot";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Only cards that are on this page, each at most once.
  const placed = resolveMobileSlots(mobile.slots ?? [], widgets);
  const slots = placed.map((c) => c.slot);
  const placedIds = new Set(slots.map((s) => s.id));
  const tray = pickTrayWidgets(widgets);
  const selected = placed.find((c) => c.widget.id === selectedId);
  const menuLabel = (id: string | undefined) => {
    const parent = widgets.find((w) => w.id === id && w.type === "menu");
    return parent ? (parent.config as MenuWidgetConfig).label : undefined;
  };

  const setSlots = (next: MobileSlot[]) => onMobileChange({ ...mobile, slots: next });

  function insertAt(id: string, at: number) {
    if (placedIds.has(id) || !tray.some((w) => w.id === id)) return;
    setSlots(insertSlot(slots, id, at));
    setSelectedId(id);
  }

  const moveTo = (from: number, to: number) => setSlots(moveSlot(slots, from, to));

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

        {/* phone + the selected card's settings */}
        <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-6 gap-6">
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative rounded-[36px] border-[3px] border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/70 flex flex-col overflow-hidden"
              style={{ width: 320, minHeight: 580, maxHeight: 680 }}
            >
              <div className="shrink-0 flex justify-center pt-3 pb-2">
                <div className="w-24 h-5 rounded-full bg-zinc-800" />
              </div>

              <div
                className="flex-1 overflow-y-auto px-3 pb-3 grid gap-2 content-start"
                style={{ gridTemplateColumns: `repeat(${PHONE_GRID_COLUMNS}, minmax(0, 1fr))` }}
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
              >
                {placed.map(({ widget, slot }, i) => (
                  <div
                    key={widget.id}
                    className="min-w-0"
                    style={{ gridColumn: `span ${phoneColumns(slot.span, showsFeed(phoneAppConfig(widget.config as AppWidgetConfig, slot)))}` }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={(e) => handleDrop(e, i)}
                  >
                    <PhoneSlot
                      widget={widget}
                      slot={slot}
                      selected={selectedId === widget.id}
                      isDragOver={dragOverIdx === i}
                      onSelect={() => setSelectedId(widget.id)}
                      onDragStart={() => { dragFromRef.current = i; }}
                    />
                  </div>
                ))}

                <div
                  onDragOver={(e) => { e.preventDefault(); setOverEnd(true); }}
                  onDragLeave={() => setOverEnd(false)}
                  onDrop={(e) => handleDrop(e, placed.length)}
                  className={`col-span-full flex items-center justify-center h-12 rounded-xl border-2 border-dashed transition-colors text-xs ${
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
            <p className="text-[10px] text-zinc-600">Click a card to set its width and logo view · drag to reorder</p>
          </div>

          {selected ? (
            <CardSettings
              widget={selected.widget}
              slot={selected.slot}
              onChange={(patch) => setSlots(updateSlot(slots, selected.widget.id, patch))}
              onRemove={() => { setSlots(removeSlot(slots, selected.widget.id)); setSelectedId(null); }}
            />
          ) : (
            <div className="w-64 shrink-0 p-4 text-xs text-zinc-600 border border-dashed border-white/[0.08] rounded-2xl">
              Click a card on the phone to set how wide it is and how its logo shows there.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
