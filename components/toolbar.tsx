"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { PageMeta, Permission } from "@/types/permissions";
import { ADMIN_TAB_INFO, type AdminTab } from "@/lib/admin-tabs";
import type { ToolbarStyle } from "@/types/toolbar";
import { TOOLBAR_DEFAULTS } from "@/types/toolbar";

// ─── Icons ────────────────────────────────────────────────────────────────────

function PencilIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function LogOutIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function UsersIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function KeyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

function ShieldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function LogInIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
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

function GearIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function DotsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

function PhoneIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

// ─── ClientPortal ─────────────────────────────────────────────────────────────

const noopSubscribe = () => () => {};

function ClientPortal({ children }: { children: React.ReactNode }) {
  // false while server rendering, true in the browser, without a mount effect.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── Page settings popover ────────────────────────────────────────────────────

interface PageSettingsPopoverProps {
  page: PageMeta;
  availablePermissions: Permission[];
  onClose: () => void;
  onUpdate: (patch: { label?: string; permissions?: string[] }) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function PageSettingsPopover({ page, availablePermissions, onClose, onUpdate, onDelete, canDelete }: PageSettingsPopoverProps) {
  const [label, setLabel] = useState(page.label);
  const [perms, setPerms] = useState<string[]>(page.permissions ?? []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  function togglePerm(id: string) {
    setPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  function handleSave() {
    onUpdate({ label: label.trim() || page.label, permissions: perms });
    onClose();
  }

  return (
    <div
      ref={ref}
      className="w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-4 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Page label</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          className="h-8 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand/50"
          autoFocus
        />
      </div>

      {availablePermissions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Required permissions</p>
          <p className="text-[10px] text-zinc-600 leading-snug">Who can see this page tab.</p>
          <div className="flex flex-col gap-1.5 mt-1">
            {availablePermissions.map((p) => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={perms.includes(p.id)}
                  onChange={() => togglePerm(p.id)}
                  className="accent-white"
                />
                <span className="text-xs text-zinc-200">{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 h-7 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white transition-colors"
        >
          Save
        </button>
        {canDelete && (
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="h-7 px-3 rounded-lg text-red-400 border border-red-900/60 text-xs hover:bg-red-900/25 hover:border-red-700 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Toolbar style panel ──────────────────────────────────────────────────────

function ColorRow({ label, value, onSet }: { label: string; value: string; onSet: (v: string) => void }) {
  const isAuto = value === "transparent" || value.startsWith("rgba");
  const displayValue = isAuto ? "#181818" : value;
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className="w-5 h-5 rounded shrink-0 overflow-hidden relative ring-1 ring-white/20"
        style={{ backgroundColor: displayValue }}
      >
        <input
          type="color"
          value={displayValue}
          onChange={(e) => onSet(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
      <span className="text-xs text-zinc-400 flex-1 group-hover:text-zinc-200 transition-colors">{label}</span>
      <span className="text-[10px] font-mono text-zinc-600">{isAuto ? "auto" : value}</span>
    </label>
  );
}

function SliderRow({ label, value, min, max, unit = "", onSet }: {
  label: string; value: number; min: number; max: number; unit?: string; onSet: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onSet(Number(e.target.value))}
        className="flex-1 h-1 cursor-pointer accent-brand"
      />
      <span className="text-[10px] font-mono text-zinc-500 w-10 text-right">{value}{unit}</span>
    </div>
  );
}

interface ToolbarStylePanelProps {
  style: ToolbarStyle;
  onChange: (s: ToolbarStyle) => void;
  onClose: () => void;
}

function ToolbarStylePanel({ style, onChange, onClose }: ToolbarStylePanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const bgColor = style.bgColor ?? TOOLBAR_DEFAULTS.bgColor;
  const activeTabColor = style.activeTabColor ?? TOOLBAR_DEFAULTS.activeTabColor;
  const tabColor = style.tabColor ?? TOOLBAR_DEFAULTS.tabColor;
  const height = style.height ?? TOOLBAR_DEFAULTS.height;
  const tabRadius = style.tabRadius ?? TOOLBAR_DEFAULTS.tabRadius;
  const gap = style.gap ?? TOOLBAR_DEFAULTS.gap;
  const blur = style.blur ?? TOOLBAR_DEFAULTS.blur;
  const tabVariant = style.tabVariant ?? TOOLBAR_DEFAULTS.tabVariant;
  const buttonBg = style.buttonBg ?? TOOLBAR_DEFAULTS.buttonBg;
  const buttonBorderColor = style.buttonBorderColor ?? TOOLBAR_DEFAULTS.buttonBorderColor;
  const buttonIconColor = style.buttonIconColor ?? TOOLBAR_DEFAULTS.buttonIconColor;

  function set<K extends keyof ToolbarStyle>(key: K, value: ToolbarStyle[K]) {
    onChange({ ...style, [key]: value });
  }

  return (
    <div
      ref={ref}
      className="w-72 bg-zinc-900/98 border border-zinc-800 rounded-xl shadow-2xl shadow-black/70 p-4 flex flex-col gap-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Toolbar style</p>

      {/* Bar colors */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-700">Bar</p>
        <ColorRow label="Background" value={bgColor} onSet={(v) => set("bgColor", v)} />
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Tab colors & style */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-700">Tabs</p>
        <ColorRow label="Active" value={activeTabColor} onSet={(v) => set("activeTabColor", v)} />
        <ColorRow label="Inactive" value={tabColor} onSet={(v) => set("tabColor", v)} />

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-400 w-16 shrink-0">Style</span>
          <div className="flex flex-1 gap-0.5 p-0.5 bg-zinc-800/60 rounded-lg border border-zinc-700/40">
            {(["pill", "underline"] as const).map((v) => (
              <button
                key={v}
                onClick={() => set("tabVariant", v)}
                className={`flex-1 py-1 text-[11px] rounded-md transition-all capitalize ${tabVariant === v ? "bg-zinc-100/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <SliderRow label="Radius" value={tabRadius} min={0} max={24} unit="px" onSet={(v) => set("tabRadius", v)} />
        <SliderRow label="Gap" value={gap} min={0} max={16} unit="px" onSet={(v) => set("gap", v)} />
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Buttons */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-700">Buttons</p>
        <ColorRow label="Background" value={buttonBg} onSet={(v) => set("buttonBg", v)} />
        <ColorRow label="Border" value={buttonBorderColor} onSet={(v) => set("buttonBorderColor", v)} />
        <ColorRow label="Icon" value={buttonIconColor} onSet={(v) => set("buttonIconColor", v)} />
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Bar layout */}
      <div className="flex flex-col gap-2.5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-700">Layout</p>
        <SliderRow label="Height" value={height} min={36} max={72} unit="px" onSet={(v) => set("height", v)} />
        <SliderRow label="Blur" value={blur} min={0} max={24} unit="px" onSet={(v) => set("blur", v)} />
      </div>

      <div className="h-px bg-white/[0.06]" />

      <button
        onClick={() => onChange({})}
        className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors text-left"
      >
        Reset to defaults
      </button>
    </div>
  );
}

// ─── Admin menu ───────────────────────────────────────────────────────────────

interface AdminMenuProps {
  editMode: boolean;
  /** Undefined when the viewer can't edit layouts. */
  onToggleEdit?: () => void;
  links: AdminTab[];
  btnStyle: React.CSSProperties;
  btnCls: string;
}

const LINK_ICONS: Record<AdminTab, (p: { size?: number }) => React.JSX.Element> = {
  users: UsersIcon,
  permissions: ShieldIcon,
  keys: KeyIcon,
  settings: GearIcon,
};

function AdminMenu({ editMode, onToggleEdit, links, btnStyle, btnCls }: AdminMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const menuItemCls =
    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left " +
    "hover:bg-white/[0.07]";

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        title="Admin"
        className={`${btnCls} ${menuOpen ? "!bg-white/[0.08] !text-zinc-300" : ""}`}
        style={btnStyle}
      >
        <DotsIcon size={16} />
        {editMode && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand" />
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-1.5 flex flex-col gap-0.5">
          {onToggleEdit && (
            <button
              onClick={() => { onToggleEdit(); setMenuOpen(false); }}
              className={`${menuItemCls} ${editMode ? "text-brand" : "text-zinc-300"}`}
            >
              <PencilIcon size={14} />
              <span>{editMode ? "Stop editing" : "Edit layout"}</span>
              {editMode && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
            </button>
          )}

          {onToggleEdit && links.length > 0 && <div className="h-px bg-white/[0.06] my-0.5" />}

          {links.map((tab) => {
            const Icon = LINK_ICONS[tab];
            return (
              <Link
                key={tab}
                href={ADMIN_TAB_INFO[tab].href}
                onClick={() => setMenuOpen(false)}
                className={`${menuItemCls} text-zinc-400 hover:text-zinc-200`}
              >
                <Icon size={14} />
                {ADMIN_TAB_INFO[tab].label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface ToolbarProps {
  editMode: boolean;
  onToggleEdit: () => void;
  /** Can edit layouts (pages:update). */
  canEdit?: boolean;
  /** Admin areas to link to from the menu. */
  adminLinks?: AdminTab[];
  loggedIn?: boolean;
  pages?: PageMeta[];
  currentPage?: string;
  onPageChange?: (name: string) => void;
  onCreatePage?: () => void;
  onUpdatePage?: (name: string, patch: { label?: string; permissions?: string[] }) => void;
  onDeletePage?: (name: string) => void;
  availablePermissions?: Permission[];
  toolbarStyle?: ToolbarStyle;
  onToolbarStyleChange?: (s: ToolbarStyle) => void;
  mobileEditorOpen?: boolean;
  onMobileEditorToggle?: () => void;
  mobileEnabled?: boolean;
}

export default function Toolbar({
  editMode,
  onToggleEdit,
  canEdit = false,
  adminLinks = [],
  loggedIn,
  pages = [],
  currentPage,
  onPageChange,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  availablePermissions = [],
  toolbarStyle = {},
  onToolbarStyleChange,
  mobileEditorOpen,
  onMobileEditorToggle,
  mobileEnabled,
}: ToolbarProps) {
  const editing = canEdit && editMode;
  const showTabs = pages.length > 1 || (editing && pages.length >= 1);

  const [settingsPage, setSettingsPage] = useState<string | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<{ x: number; y: number } | null>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const [styleAnchor, setStyleAnchor] = useState<{ x: number; y: number } | null>(null);

  const bgColor = toolbarStyle.bgColor ?? TOOLBAR_DEFAULTS.bgColor;
  const activeTabColor = toolbarStyle.activeTabColor ?? TOOLBAR_DEFAULTS.activeTabColor;
  const tabColor = toolbarStyle.tabColor ?? TOOLBAR_DEFAULTS.tabColor;
  const height = toolbarStyle.height ?? TOOLBAR_DEFAULTS.height;
  const tabRadius = toolbarStyle.tabRadius ?? TOOLBAR_DEFAULTS.tabRadius;
  const gap = toolbarStyle.gap ?? TOOLBAR_DEFAULTS.gap;
  const blur = toolbarStyle.blur ?? TOOLBAR_DEFAULTS.blur;
  const tabVariant = toolbarStyle.tabVariant ?? TOOLBAR_DEFAULTS.tabVariant;
  const buttonBg = toolbarStyle.buttonBg ?? TOOLBAR_DEFAULTS.buttonBg;
  const buttonBorderColor = toolbarStyle.buttonBorderColor ?? TOOLBAR_DEFAULTS.buttonBorderColor;
  const buttonIconColor = toolbarStyle.buttonIconColor ?? TOOLBAR_DEFAULTS.buttonIconColor;

  const btnCls =
    "relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 " +
    "hover:brightness-125";

  const btnStyle: React.CSSProperties = {
    backgroundColor: buttonBg,
    borderColor: buttonBorderColor,
    color: buttonIconColor,
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function handleTabSettings(e: React.MouseEvent, pageName: string) {
    e.stopPropagation();
    if (settingsPage === pageName) {
      setSettingsPage(null);
      setSettingsAnchor(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setSettingsPage(pageName);
      setSettingsAnchor({ x: rect.left, y: rect.bottom + 4 });
    }
  }

  function closeSettings() {
    setSettingsPage(null);
    setSettingsAnchor(null);
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!editing || !onToolbarStyleChange) return;
    e.preventDefault();
    const panelWidth = 288;
    const x = Math.min(e.clientX, window.innerWidth - panelWidth - 16);
    setStyleAnchor({ x, y: e.clientY });
    setStyleOpen(true);
  }

  const settingsPageMeta = settingsPage ? pages.find((p) => p.name === settingsPage) : null;

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-20 border-b border-white/[0.06] flex items-center px-6 gap-4"
        style={{
          backgroundColor: bgColor,
          backdropFilter: `blur(${blur}px)`,
          height: `${height}px`,
        }}
        onContextMenu={handleContextMenu}
      >
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-brand via-brand-alt to-brand opacity-20 pointer-events-none" />

        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="Appetizer" className="h-8 w-auto" />
        </div>

        {/* Page tabs */}
        {showTabs && (
          <div
            className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-none"
            style={{ gap: `${gap}px` }}
          >
            {pages.map((page) => {
              const isActive = page.name === currentPage;
              const isUnderline = tabVariant === "underline";
              return (
                <div
                  key={page.name}
                  className="relative shrink-0 flex items-center"
                  style={isUnderline ? { alignSelf: "stretch" } : {}}
                >
                  <div
                    className="flex items-center transition-all"
                    style={{
                      backgroundColor: !isUnderline && isActive ? `${activeTabColor}1a` : undefined,
                      borderRadius: !isUnderline ? `${tabRadius}px` : undefined,
                    }}
                  >
                    <button
                      onClick={() => onPageChange?.(page.name)}
                      className="h-8 px-3 text-xs font-medium transition-colors whitespace-nowrap hover:opacity-90"
                      style={{ color: isActive ? activeTabColor : tabColor }}
                    >
                      {page.label}
                    </button>
                    {editing && onUpdatePage && (
                      <button
                        onClick={(e) => handleTabSettings(e, page.name)}
                        title="Page settings"
                        className={`mr-1.5 w-5 h-5 flex items-center justify-center rounded transition-colors ${settingsPage === page.name ? "text-zinc-300 bg-white/[0.08]" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.08]"}`}
                      >
                        <GearIcon size={11} />
                      </button>
                    )}
                  </div>

                  {isUnderline && isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: activeTabColor }}
                    />
                  )}
                </div>
              );
            })}

            {editing && onCreatePage && (
              <button
                onClick={onCreatePage}
                title="New page"
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.08] transition-colors ml-1"
              >
                <PlusIcon size={13} />
              </button>
            )}
          </div>
        )}

        {!showTabs && <div className="flex-1" />}

        <div className="flex items-center gap-2 shrink-0">
          {editing && onMobileEditorToggle && (
            <button
              onClick={onMobileEditorToggle}
              title="Mobile layout"
              className={`${btnCls} ${mobileEditorOpen ? "!bg-white/[0.12] !text-zinc-100" : ""}`}
              style={btnStyle}
            >
              <PhoneIcon size={15} />
              {mobileEnabled && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          )}

          {(canEdit || adminLinks.length > 0) && (
            <AdminMenu
              editMode={editMode}
              onToggleEdit={canEdit ? onToggleEdit : undefined}
              links={adminLinks}
              btnStyle={btnStyle}
              btnCls={btnCls}
            />
          )}

          {loggedIn ? (
            <button onClick={handleLogout} title="Sign out" className={btnCls} style={btnStyle}>
              <LogOutIcon size={15} />
            </button>
          ) : (
            <Link href="/login" title="Sign in" className={btnCls} style={btnStyle}>
              <LogInIcon size={15} />
            </Link>
          )}
        </div>
      </div>

      {/* Page settings portal */}
      <ClientPortal>
        {settingsPageMeta && settingsAnchor && onUpdatePage && (
          <div style={{ position: "fixed", left: settingsAnchor.x, top: settingsAnchor.y, zIndex: 9999 }}>
            <PageSettingsPopover
              page={settingsPageMeta}
              availablePermissions={availablePermissions}
              onClose={closeSettings}
              onUpdate={(patch) => onUpdatePage(settingsPageMeta.name, patch)}
              onDelete={() => { onDeletePage?.(settingsPageMeta.name); closeSettings(); }}
              canDelete={pages.length > 1 && !!onDeletePage}
            />
          </div>
        )}
      </ClientPortal>

      {/* Toolbar style panel portal — triggered by right-click */}
      <ClientPortal>
        {styleOpen && styleAnchor && onToolbarStyleChange && (
          <div style={{ position: "fixed", left: styleAnchor.x, top: styleAnchor.y, zIndex: 9999 }}>
            <ToolbarStylePanel
              style={toolbarStyle}
              onChange={onToolbarStyleChange}
              onClose={() => { setStyleOpen(false); setStyleAnchor(null); }}
            />
          </div>
        )}
      </ClientPortal>
    </>
  );
}
