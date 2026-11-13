"use client";

import { useEffect, useRef, useState } from "react";
import BackgroundFields from "@/components/background-fields";
import AppWidgetFields from "@/components/widgets/app-widget-fields";
import MenuWidgetFields from "@/components/widgets/menu-widget-fields";
import LayoutWidgetFields from "@/components/widgets/layout-widget-fields";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { MenuWidgetConfig } from "@/types/menu-widget";
import type { LayoutWidgetConfig } from "@/types/layout-widget";
import type { Permission } from "@/types/permissions";

const DEFAULT_WIDTH = 680;
const MIN_WIDTH = 340;
const MAX_WIDTH = 1200;

interface Props {
  bg: BackgroundConfig;
  onBgChange: (bg: BackgroundConfig) => void;
  bgEditorOpen: boolean;
  onBgEditorOpenChange: (open: boolean) => void;
  editingWidget: WidgetInstance | null;
  onEditingWidgetClose: () => void;
  onUpdateWidget: (id: string, partial: Partial<WidgetInstance>) => void;
  onDeleteWidget: (id: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  keyNames?: string[];
  availablePermissions?: Permission[];
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
    <div className="bg-zinc-900 rounded-2xl shadow-2xl shadow-black/50 w-full max-h-[80vh] flex flex-col overflow-hidden border border-white/[0.06]">
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

export default function EditorPanel({
  bg,
  onBgChange,
  bgEditorOpen,
  onBgEditorOpenChange,
  editingWidget,
  onEditingWidgetClose,
  onUpdateWidget,
  onDeleteWidget,
  onExport,
  onImport,
  keyNames = [],
  availablePermissions = [],
}: Props) {
  const [panelPos, setPanelPos] = useState({ left: 16, bottom: 32 });
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);

  // ── Draft state ───────────────────────────────────────────────────────────
  const [draftConfig, setDraftConfig] = useState<WidgetInstance["config"] | null>(null);
  const [savedConfig, setSavedConfig] = useState<WidgetInstance["config"] | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [savedPermissions, setSavedPermissions] = useState<string[]>([]);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editingWidget) {
      prevIdRef.current = null;
      setDraftConfig(null);
      setSavedConfig(null);
      setDraftPermissions([]);
      setSavedPermissions([]);
      return;
    }
    if (editingWidget.id !== prevIdRef.current) {
      prevIdRef.current = editingWidget.id;
      setDraftConfig(editingWidget.config);
      setSavedConfig(editingWidget.config);
      setDraftPermissions(editingWidget.permissions ?? []);
      setSavedPermissions(editingWidget.permissions ?? []);
    }
  }, [editingWidget]);

  const hasChanges =
    (draftConfig !== null && JSON.stringify(draftConfig) !== JSON.stringify(savedConfig)) ||
    JSON.stringify(draftPermissions) !== JSON.stringify(savedPermissions);

  function handleSave() {
    if (editingWidget && draftConfig) {
      onUpdateWidget(editingWidget.id, { config: draftConfig, permissions: draftPermissions });
      setSavedConfig(draftConfig);
      setSavedPermissions(draftPermissions);
    }
  }

  function handleRevert() {
    setDraftConfig(savedConfig);
    setDraftPermissions(savedPermissions);
  }

  // ── Panel position drag ───────────────────────────────────────────────────
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

  // ── Panel resize drag ─────────────────────────────────────────────────────
  function handleResizeDragStart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = panelWidth;

    function onMove(me: MouseEvent) {
      setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + me.clientX - startX)));
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Shared widget footer ──────────────────────────────────────────────────
  function widgetFooter(deleteLabel: string, onDelete: () => void) {
    return (
      <>
        <button
          onClick={handleRevert}
          disabled={!hasChanges}
          className="flex-1 py-2 text-xs font-semibold text-zinc-400 border border-zinc-700 rounded-lg transition-colors
            enabled:hover:bg-zinc-800 enabled:hover:text-zinc-200 enabled:hover:border-zinc-600
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Revert
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors
            enabled:bg-emerald-600 enabled:text-white enabled:hover:bg-emerald-500
            disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
        >
          Save
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 flex-1 py-2 text-xs font-semibold text-red-400 border border-red-900/60 rounded-lg hover:bg-red-900/25 hover:text-red-300 hover:border-red-700 transition-colors"
        >
          <TrashIcon size={13} />
          {deleteLabel}
        </button>
      </>
    );
  }

  const panelOpen = bgEditorOpen || editingWidget !== null;
  if (!panelOpen) return null;

  return (
    <div
      data-no-menu
      className="absolute z-10"
      style={{ left: panelPos.left, bottom: panelPos.bottom, width: panelWidth }}
    >
      {/* Right-edge resize handle */}
      <div
        className="absolute top-0 bottom-0 right-0 w-1.5 cursor-ew-resize z-20 rounded-r-2xl hover:bg-white/10 transition-colors"
        onMouseDown={handleResizeDragStart}
      />

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

      {editingWidget?.type === "layout" && draftConfig && (() => {
        const cfg = draftConfig as LayoutWidgetConfig;
        return (
          <Panel
            title={cfg.label || "Layout"}
            onClose={onEditingWidgetClose}
            onDragStart={handlePanelDragStart}
            footer={widgetFooter("Delete Layout", () => { onDeleteWidget(editingWidget.id); onEditingWidgetClose(); })}
          >
            <LayoutWidgetFields
              value={cfg}
              onChange={(config) => setDraftConfig(config)}
              permissions={draftPermissions}
              onPermissionsChange={setDraftPermissions}
              availablePermissions={availablePermissions}
            />
          </Panel>
        );
      })()}

      {editingWidget?.type === "menu" && draftConfig && (() => {
        const cfg = draftConfig as MenuWidgetConfig;
        return (
          <Panel
            title={cfg.label || "Menu"}
            onClose={onEditingWidgetClose}
            onDragStart={handlePanelDragStart}
            footer={widgetFooter("Delete Menu", () => { onDeleteWidget(editingWidget.id); onEditingWidgetClose(); })}
          >
            <MenuWidgetFields
              value={cfg}
              onChange={(config) => setDraftConfig(config)}
              permissions={draftPermissions}
              onPermissionsChange={setDraftPermissions}
              availablePermissions={availablePermissions}
            />
          </Panel>
        );
      })()}

      {editingWidget?.type === "app" && draftConfig && (() => {
        const cfg = draftConfig as AppWidgetConfig;
        return (
          <Panel
            title={cfg.title || "Untitled App"}
            subtitle={cfg.url || undefined}
            onClose={onEditingWidgetClose}
            onDragStart={handlePanelDragStart}
            footer={widgetFooter("Delete App", () => { onDeleteWidget(editingWidget.id); onEditingWidgetClose(); })}
          >
            <AppWidgetFields
              value={cfg}
              onChange={(config) => setDraftConfig(config)}
              keyNames={keyNames}
              permissions={draftPermissions}
              onPermissionsChange={setDraftPermissions}
              availablePermissions={availablePermissions}
            />
          </Panel>
        );
      })()}
    </div>
  );
}
