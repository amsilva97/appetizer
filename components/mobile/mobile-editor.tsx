"use client";

import { useRef, useState } from "react";
import type { MobileConfig, MobileScreen } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { LayoutWidgetConfig } from "@/types/layout-widget";
import type { MenuWidgetConfig } from "@/types/menu-widget";

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function GripIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="7"  r="1" fill="currentColor" />
      <circle cx="15" cy="7"  r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="17" r="1" fill="currentColor" />
      <circle cx="15" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function widgetLabel(w: WidgetInstance): string {
  switch (w.type) {
    case "app":    return (w.config as AppWidgetConfig).title || "App";
    case "layout": return (w.config as LayoutWidgetConfig).label || "Layout";
    case "menu":   return (w.config as MenuWidgetConfig).label || "Menu";
  }
}

function nextId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Widget Tray ─────────────────────────────────────────────────────────────

interface TrayItemProps {
  widget: WidgetInstance;
  onDragStart: (id: string) => void;
  inUse: boolean;
}

function TrayItem({ widget, onDragStart, inUse }: TrayItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", widget.id);
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(widget.id);
      }}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors select-none cursor-grab active:cursor-grabbing ${
        inUse
          ? "border-brand/40 bg-brand/[0.08] opacity-60"
          : "border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 hover:border-zinc-600"
      }`}
    >
      <GripIcon size={14} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-200 truncate">{widgetLabel(widget)}</p>
        <p className="text-[10px] text-zinc-600 capitalize">{widget.type}</p>
      </div>
      {inUse && (
        <span className="text-[9px] font-semibold text-brand/70 uppercase tracking-wide shrink-0">added</span>
      )}
    </div>
  );
}

// ─── Phone Frame ──────────────────────────────────────────────────────────────

interface PhoneSlotProps {
  widgetId: string;
  widget: WidgetInstance | undefined;
  index: number;
  onRemove: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  isDragOver: boolean;
}

function PhoneSlot({ widgetId, widget, index, onRemove, onDragStart, onDragOver, isDragOver }: PhoneSlotProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("slot-index", String(index));
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all select-none cursor-grab active:cursor-grabbing ${
        isDragOver
          ? "border-brand/60 bg-brand/[0.1]"
          : "border-white/[0.08] bg-white/[0.05]"
      }`}
    >
      <GripIcon size={12} />
      <p className="flex-1 text-xs text-zinc-300 truncate">
        {widget ? widgetLabel(widget) : <span className="text-zinc-600 italic">{widgetId}</span>}
      </p>
      <button
        onClick={onRemove}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
      >
        <XIcon size={11} />
      </button>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onDrop: (widgetId: string) => void;
}

function DropZone({ onDrop }: DropZoneProps) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id);
      }}
      className={`flex items-center justify-center h-12 rounded-xl border-2 border-dashed transition-colors text-xs ${
        over
          ? "border-brand/60 bg-brand/[0.08] text-brand"
          : "border-white/10 text-zinc-700"
      }`}
    >
      {over ? "Drop here" : "+ Drag widget here"}
    </div>
  );
}

// ─── Mobile Editor ────────────────────────────────────────────────────────────

interface Props {
  mobile: MobileConfig;
  widgets: WidgetInstance[];
  mobileEnabled: boolean;
  onMobileChange: (m: MobileConfig) => void;
  onMobileEnabledChange: (enabled: boolean) => void;
  onClose: () => void;
}

export default function MobileEditor({ mobile, widgets, mobileEnabled, onMobileChange, onMobileEnabledChange, onClose }: Props) {
  const [activeScreenIdx, setActiveScreenIdx] = useState(0);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const dragSlotRef = useRef<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const screens = mobile.screens ?? [];
  const activeScreen: MobileScreen | undefined = screens[activeScreenIdx];

  const usedWidgetIds = new Set(screens.flatMap((s) => s.slots));

  // top-level widgets only (no children)
  const trayWidgets = widgets.filter((w) => !w.parentId);

  function updateScreen(idx: number, patch: Partial<MobileScreen>) {
    const updated = screens.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onMobileChange({ ...mobile, screens: updated });
  }

  function addScreen() {
    const taken = new Set(screens.map((s) => s.label));
    let n = 1;
    while (taken.has(`Screen ${n}`)) n++;
    const label = `Screen ${n}`;
    const name = `screen_${nextId()}`;
    const updated = [...screens, { name, label, slots: [] }];
    onMobileChange({ ...mobile, screens: updated });
    setActiveScreenIdx(updated.length - 1);
  }

  function deleteScreen(idx: number) {
    if (screens.length <= 1) return;
    const updated = screens.filter((_, i) => i !== idx);
    onMobileChange({ ...mobile, screens: updated });
    setActiveScreenIdx(Math.min(activeScreenIdx, updated.length - 1));
  }

  function addSlot(widgetId: string) {
    if (!activeScreen) return;
    if (activeScreen.slots.includes(widgetId)) return;
    updateScreen(activeScreenIdx, { slots: [...activeScreen.slots, widgetId] });
  }

  function removeSlot(slotIdx: number) {
    if (!activeScreen) return;
    updateScreen(activeScreenIdx, { slots: activeScreen.slots.filter((_, i) => i !== slotIdx) });
  }

  function handleSlotDragOver(toIdx: number) {
    setDragOverSlot(toIdx);
  }

  function handleSlotDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault();
    setDragOverSlot(null);
    const fromIdx = dragSlotRef.current;
    if (fromIdx === null || !activeScreen) return;
    if (fromIdx === toIdx) return;
    const slots = [...activeScreen.slots];
    const [moved] = slots.splice(fromIdx, 1);
    slots.splice(toIdx, 0, moved);
    updateScreen(activeScreenIdx, { slots });
    dragSlotRef.current = null;
  }

  function startRenameScreen(idx: number) {
    setRenamingIdx(idx);
    setRenameValue(screens[idx]?.label ?? "");
  }

  function commitRename() {
    if (renamingIdx === null) return;
    const label = renameValue.trim();
    if (label) updateScreen(renamingIdx, { label });
    setRenamingIdx(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/90 backdrop-blur-sm">
      {/* header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <span className="text-sm font-semibold text-zinc-100">Mobile Layout Editor</span>
        </div>

        {/* mobile enabled toggle */}
        <label className="flex items-center gap-2 ml-2 cursor-pointer">
          <div
            onClick={() => onMobileEnabledChange(!mobileEnabled)}
            className={`relative w-9 h-5 rounded-full transition-colors ${mobileEnabled ? "bg-brand" : "bg-zinc-700"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${mobileEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-xs text-zinc-400">
            {mobileEnabled ? "Mobile enabled" : "Mobile disabled"}
          </span>
        </label>

        <div className="flex-1" />

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.07] transition-colors"
        >
          <XIcon size={16} />
        </button>
      </div>

      {/* body */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* widget tray */}
        <div className="w-72 shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Widget Tray</p>
            <p className="text-[10px] text-zinc-700 mt-0.5">Drag widgets onto a screen</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {trayWidgets.length === 0 && (
              <p className="text-xs text-zinc-700 text-center mt-8">No widgets on this page yet.</p>
            )}
            {trayWidgets.map((w) => (
              <TrayItem
                key={w.id}
                widget={w}
                inUse={usedWidgetIds.has(w.id)}
                onDragStart={() => {}}
              />
            ))}
          </div>
        </div>

        {/* phone frame area */}
        <div className="flex-1 overflow-auto flex flex-col items-center py-8 gap-6">
          {/* screen tabs */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {screens.map((screen, i) => (
              <div key={screen.name} className="flex items-center">
                {renamingIdx === i ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingIdx(null); }}
                    className="h-7 px-2 text-xs rounded-lg bg-zinc-800 border border-brand/50 text-zinc-100 focus:outline-none w-28"
                  />
                ) : (
                  <button
                    onClick={() => setActiveScreenIdx(i)}
                    onDoubleClick={() => startRenameScreen(i)}
                    className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                      i === activeScreenIdx
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
                    }`}
                    title="Double-click to rename"
                  >
                    {screen.label}
                  </button>
                )}
                {screens.length > 1 && i === activeScreenIdx && renamingIdx !== i && (
                  <button
                    onClick={() => deleteScreen(i)}
                    className="ml-1 w-5 h-5 flex items-center justify-center rounded text-zinc-700 hover:text-red-400 transition-colors"
                  >
                    <XIcon size={10} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addScreen}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
              title="Add screen"
            >
              <PlusIcon size={12} />
            </button>
          </div>

          {/* phone body */}
          <div
            className="relative rounded-[36px] border-[3px] border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/70 flex flex-col overflow-hidden"
            style={{ width: 320, minHeight: 580, maxHeight: 680 }}
          >
            {/* notch */}
            <div className="shrink-0 flex justify-center pt-3 pb-2">
              <div className="w-24 h-5 rounded-full bg-zinc-800" />
            </div>

            {/* slot list — also a drop target */}
            <div
              className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2"
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                // drop from tray (text/plain = widgetId)
                const widgetId = e.dataTransfer.getData("text/plain");
                if (widgetId) { addSlot(widgetId); return; }
              }}
            >
              {activeScreen?.slots.map((id, slotIdx) => (
                <div
                  key={id + slotIdx}
                  onDragOver={(e) => { e.preventDefault(); handleSlotDragOver(slotIdx); }}
                  onDrop={(e) => handleSlotDrop(e, slotIdx)}
                >
                  <PhoneSlot
                    widgetId={id}
                    widget={trayWidgets.find((w) => w.id === id)}
                    index={slotIdx}
                    onRemove={() => removeSlot(slotIdx)}
                    onDragStart={(i) => { dragSlotRef.current = i; }}
                    onDragOver={handleSlotDragOver}
                    isDragOver={dragOverSlot === slotIdx}
                  />
                </div>
              ))}

              <DropZone onDrop={addSlot} />
            </div>

            {/* home bar */}
            <div className="shrink-0 flex justify-center py-2">
              <div className="w-24 h-1 rounded-full bg-zinc-700" />
            </div>
          </div>

          <p className="text-[10px] text-zinc-700">Double-click a screen tab to rename it</p>
        </div>
      </div>
    </div>
  );
}
