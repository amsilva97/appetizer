"use client";

import { useState } from "react";
import Editor from "@/components/editor";
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
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-black/[0.12] w-80 max-h-[80vh] flex flex-col overflow-hidden border border-black/[0.06]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-3 shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <XIcon />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-4">{children}</div>
      {footer && (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100 shrink-0">{footer}</div>
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
  onAddWidget,
  onExport,
  onImport,
}: Props) {
  const [dialOpen, setDialOpen] = useState(false);

  const panelOpen = bgEditorOpen || editingWidget !== null;

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
    <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-3">
      {/* Active panel — above FAB cluster */}
      {bgEditorOpen && (
        <Panel
          title="Background"
          onClose={() => onBgEditorOpenChange(false)}
          footer={
            <>
              <button
                onClick={onExport}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Export YAML
              </button>
              <label className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-center cursor-pointer">
                Import YAML
                <input type="file" accept=".yaml,.yml" className="hidden" onChange={onImport} />
              </label>
            </>
          }
        >
          <Editor
            value={bg}
            onChange={onBgChange}
            renderFields={(val, set) => <BackgroundFields value={val} onChange={set} />}
          />
        </Panel>
      )}

      {editingWidget?.type === "app" && (
        <Panel
          title={editingWidget.config.title || "Untitled App"}
          subtitle={editingWidget.config.url || undefined}
          onClose={onEditingWidgetClose}
        >
          <Editor
            value={editingWidget.config}
            onChange={(config) => onUpdateWidget(editingWidget.id, { config })}
            renderFields={(val, set) => <AppWidgetFields value={val} onChange={set} />}
          />
        </Panel>
      )}

      {/* Speed-dial cluster */}
      <div className="flex flex-col items-start gap-2">
        {/* Sub-buttons — stagger up from the main FAB */}
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
    </div>
  );
}
