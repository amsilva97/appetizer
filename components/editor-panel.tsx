"use client";

import { useState } from "react";
import BackgroundFields from "@/components/background-fields";
import AppWidgetFields from "@/components/widgets/app-widget-fields";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";

interface Props {
  bg: BackgroundConfig;
  onBgChange: (bg: BackgroundConfig) => void;
  bgEditorOpen: boolean;
  onBgEditorOpenChange: (open: boolean) => void;
  editingWidget: WidgetInstance | null;
  onEditingWidgetClose: () => void;
  onUpdateWidget: (id: string, partial: Partial<WidgetInstance>) => void;
  onDeleteWidget: (id: string) => void;
  onAddWidget: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M3 15l5-5 4 4 2-2 4 4" />
    </svg>
  );
}

function AppCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="13" y2="14" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9"  cy="6"  r="1.5" />
      <circle cx="15" cy="6"  r="1.5" />
      <circle cx="9"  cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9"  cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

// ─── Speed-dial sub-button ────────────────────────────────────────────────────

function DialButton({
  icon,
  label,
  active = false,
  delay = 0,
  visible,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  delay?: number;
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="group relative flex items-center"
      style={{
        transitionDelay: visible ? `${delay}ms` : "0ms",
      }}
    >
      {/* Hover label */}
      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-900/85 text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {label}
      </span>

      <button
        onClick={onClick}
        className={`w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
          active
            ? "bg-gray-900 text-white shadow-gray-900/30"
            : "bg-white text-gray-700 shadow-black/15 hover:bg-gray-50 hover:text-gray-900"
        } ${
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-50 translate-y-4 pointer-events-none"
        }`}
        style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
        title={label}
      >
        {icon}
      </button>
    </div>
  );
}

// ─── Panel shell ──────────────────────────────────────────────────────────────

function Panel({
  title,
  subtitle,
  onClose,
  onDragStart,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl shadow-2xl shadow-black/50 w-[340px] max-h-[80vh] flex flex-col overflow-hidden border border-white/[0.06]">
      <div className="flex items-center justify-between border-b border-zinc-800 shrink-0" style={{ padding: "14px 24px" }}>
        <div
          className="min-w-0 flex-1 flex items-center gap-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onDragStart}
        >
          <span className="text-zinc-600 shrink-0"><GripIcon /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight leading-tight">{title}</h2>
            {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="ml-3 shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <XIcon />
        </button>
      </div>
      <div className="overflow-y-auto flex-1" style={{ padding: "20px 24px" }}>{children}</div>
      {footer && (
        <div className="flex gap-2 border-t border-zinc-800 shrink-0" style={{ padding: "12px 24px" }}>{footer}</div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EditorPanel({
  bg,
  onBgChange,
  bgEditorOpen,
  onBgEditorOpenChange,
  editingWidget,
  onEditingWidgetClose,
  onUpdateWidget,
  onDeleteWidget,
  onAddWidget,
  onExport,
  onImport,
}: Props) {
  const [dialOpen, setDialOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ left: 16, bottom: 80 });

  const panelOpen = bgEditorOpen || editingWidget !== null;

  function handlePanelDragStart(e: React.MouseEvent) {
    e.preventDefault();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startLeft = panelPos.left;
    const startBottom = panelPos.bottom;

    function onMove(me: MouseEvent) {
      setPanelPos({
        left: Math.max(0, startLeft + me.clientX - startMouseX),
        bottom: Math.max(0, startBottom - (me.clientY - startMouseY)),
      });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function openBackground() {
    setDialOpen(false);
    onBgEditorOpenChange(true);
    onEditingWidgetClose();
  }

  function handleAddWidget() {
    setDialOpen(false);
    onAddWidget();
  }

  return (
    <>
      {/* Panel — independently draggable, decoupled from FAB */}
      {panelOpen && (
        <div
          className="absolute z-10"
          style={{ left: panelPos.left, bottom: panelPos.bottom }}
        >
          {bgEditorOpen && (
            <Panel
              title="Background"
              onClose={() => onBgEditorOpenChange(false)}
              onDragStart={handlePanelDragStart}
              footer={
                <>
                  <button
                    onClick={onExport}
                    className="flex-1 py-2 text-xs font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                  >
                    Export YAML
                  </button>
                  <label className="flex-1 py-2 text-xs font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600 transition-colors text-center cursor-pointer">
                    Import YAML
                    <input type="file" accept=".yaml,.yml" className="hidden" onChange={onImport} />
                  </label>
                </>
              }
            >
              <BackgroundFields value={bg} onChange={onBgChange} />
            </Panel>
          )}

          {editingWidget?.type === "app" && (
            <Panel
              title={editingWidget.config.title || "Untitled App"}
              subtitle={editingWidget.config.url || undefined}
              onClose={onEditingWidgetClose}
              onDragStart={handlePanelDragStart}
              footer={
                <button
                  onClick={() => {
                    onDeleteWidget(editingWidget.id);
                    onEditingWidgetClose();
                  }}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2 text-xs font-semibold text-red-400 border border-red-900/60 rounded-lg hover:bg-red-900/25 hover:text-red-300 hover:border-red-700 transition-colors"
                >
                  <TrashIcon size={13} />
                  Delete App
                </button>
              }
            >
              <AppWidgetFields
                value={editingWidget.config}
                onChange={(config) => onUpdateWidget(editingWidget.id, { config })}
              />
            </Panel>
          )}
        </div>
      )}

      {/* Speed-dial cluster — fixed position, independent of panel */}
      <div
        className="absolute z-10 flex flex-col items-start gap-2"
        style={{ left: 16, bottom: 16 }}
      >
        <DialButton
          icon={<ImageIcon />}
          label="Background"
          active={bgEditorOpen}
          delay={60}
          visible={dialOpen}
          onClick={openBackground}
        />
        <DialButton
          icon={<AppCardIcon />}
          label="Add App"
          delay={20}
          visible={dialOpen}
          onClick={handleAddWidget}
        />

        {/* Main FAB */}
        <button
          onClick={() => {
            if (panelOpen) {
              onBgEditorOpenChange(false);
              onEditingWidgetClose();
            }
            setDialOpen((o) => !o);
          }}
          className={`w-11 h-11 flex items-center justify-center rounded-full shadow-xl transition-all duration-300 ${
            dialOpen || panelOpen
              ? "bg-gray-900 text-white shadow-gray-900/30 rotate-45"
              : "bg-white/95 text-gray-700 shadow-black/20 hover:bg-white hover:shadow-black/30"
          }`}
        >
          <PlusIcon size={18} />
        </button>
      </div>
    </>
  );
}
