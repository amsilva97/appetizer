"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { UserRole } from "@/lib/auth/users";
import type { PageMeta, Permission } from "@/types/permissions";

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

function UsersIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function KeyIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

function ShieldIcon({ size = 15 }: { size?: number }) {
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

function GearIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const ICON_BTN =
  "flex items-center justify-center w-9 h-9 rounded-xl text-zinc-500 border border-white/[0.08] " +
  "hover:bg-white/[0.08] hover:text-zinc-300 transition-all duration-200";

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
      className="absolute top-full left-0 mt-1 z-50 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-4 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Page label</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
          className="h-8 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand/50"
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
          className="flex-1 h-7 rounded-lg bg-brand text-zinc-950 text-xs font-semibold hover:bg-brand/80 transition-colors"
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

interface ToolbarProps {
  editMode: boolean;
  onToggleEdit: () => void;
  role?: UserRole | null;
  loggedIn?: boolean;
  pages?: PageMeta[];
  currentPage?: string;
  onPageChange?: (name: string) => void;
  onCreatePage?: () => void;
  onUpdatePage?: (name: string, patch: { label?: string; permissions?: string[] }) => void;
  onDeletePage?: (name: string) => void;
  availablePermissions?: Permission[];
}

export default function Toolbar({
  editMode,
  onToggleEdit,
  role,
  loggedIn,
  pages = [],
  currentPage,
  onPageChange,
  onCreatePage,
  onUpdatePage,
  onDeletePage,
  availablePermissions = [],
}: ToolbarProps) {
  const isAdmin = role === "admin";
  const showTabs = pages.length > 1 || (isAdmin && editMode && pages.length >= 1);
  const [settingsPage, setSettingsPage] = useState<string | null>(null);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function handleTabSettings(e: React.MouseEvent, pageName: string) {
    e.stopPropagation();
    setSettingsPage((prev) => (prev === pageName ? null : pageName));
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12 bg-zinc-900/80 backdrop-blur-md border-b border-white/[0.06] flex items-center px-6 gap-4 overflow-visible">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-brand via-brand-alt to-brand opacity-20 pointer-events-none" />
      <div className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark.png" alt="Appetizer" className="h-8 w-auto" />
      </div>

      {/* Page tabs */}
      {showTabs && (
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-none">
          {pages.map((page) => {
            const isActive = page.name === currentPage;
            return (
              <div key={page.name} className="relative shrink-0">
                <div className={`flex items-center rounded-lg transition-all ${isActive ? "bg-brand/15" : "hover:bg-white/[0.05]"}`}>
                  <button
                    onClick={() => onPageChange?.(page.name)}
                    className={`h-8 px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive ? "text-brand" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {page.label}
                  </button>
                  {isAdmin && editMode && (
                    <button
                      onClick={(e) => handleTabSettings(e, page.name)}
                      title="Page settings"
                      className={`mr-1.5 w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.08] transition-colors ${settingsPage === page.name ? "text-zinc-300 bg-white/[0.08]" : ""}`}
                    >
                      <GearIcon size={11} />
                    </button>
                  )}
                </div>

                {settingsPage === page.name && onUpdatePage && (
                  <PageSettingsPopover
                    page={page}
                    availablePermissions={availablePermissions}
                    onClose={() => setSettingsPage(null)}
                    onUpdate={(patch) => onUpdatePage(page.name, patch)}
                    onDelete={() => onDeletePage?.(page.name)}
                    canDelete={pages.length > 1}
                  />
                )}
              </div>
            );
          })}

          {isAdmin && editMode && (
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
        {isAdmin && (
          <>
            <Link href="/admin/users" title="Users" className={ICON_BTN}>
              <UsersIcon size={15} />
            </Link>
            <Link href="/admin/keys" title="Keys" className={ICON_BTN}>
              <KeyIcon size={15} />
            </Link>
            <Link href="/admin/permissions" title="Roles & Permissions" className={ICON_BTN}>
              <ShieldIcon size={15} />
            </Link>

            <div className="w-px h-5 bg-white/[0.08] mx-1" />

            <button
              onClick={onToggleEdit}
              title={editMode ? "Stop editing" : "Edit"}
              className={editMode ? "flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 bg-gradient-to-br from-brand to-brand-alt text-zinc-950 border-transparent" : ICON_BTN}
            >
              <PencilIcon size={15} />
            </button>
          </>
        )}

        {loggedIn ? (
          <button onClick={handleLogout} title="Sign out" className={ICON_BTN}>
            <LogOutIcon size={15} />
          </button>
        ) : (
          <Link href="/login" title="Sign in" className={ICON_BTN}>
            <LogInIcon size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}
