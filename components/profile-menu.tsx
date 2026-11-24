"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ADMIN_TAB_INFO, type AdminTab } from "@/lib/admin-tabs";
import {
  GearIcon,
  KeyIcon,
  LogInIcon,
  LogOutIcon,
  PencilIcon,
  PhoneIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/toolbar-icons";

const LINK_ICONS: Record<AdminTab, (p: { size?: number }) => React.JSX.Element> = {
  users: UsersIcon,
  permissions: ShieldIcon,
  keys: KeyIcon,
  settings: GearIcon,
};

/** What the profile circle shows: the first two characters of the username. */
export function profileInitials(username: string): string {
  const trimmed = username.trim();
  return trimmed ? Array.from(trimmed).slice(0, 2).join("").toUpperCase() : "?";
}

interface ProfileMenuProps {
  /** The signed-in username, or the guest name when signed out. */
  username: string;
  /** False for guests: the menu offers Sign in instead of Sign out. */
  signedIn?: boolean;
  editMode: boolean;
  /** Undefined when the viewer can't edit layouts. */
  onToggleEdit?: () => void;
  /** Admin areas the viewer can open. */
  links: AdminTab[];
  mobileEditorOpen?: boolean;
  /** Only while editing. */
  onMobileEditorToggle?: () => void;
  mobileEnabled?: boolean;
  onLogout: () => void;
  btnStyle: React.CSSProperties;
}

/**
 * The signed-in user's circle in the toolbar. One button for everything that
 * used to be separate (editing, phone layout, admin pages, sign out).
 */
export default function ProfileMenu({
  username,
  signedIn = true,
  editMode,
  onToggleEdit,
  links,
  mobileEditorOpen,
  onMobileEditorToggle,
  mobileEnabled,
  onLogout,
  btnStyle,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const itemCls =
    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left hover:bg-white/[0.07]";
  const divider = <div className="h-px bg-white/[0.06] my-0.5" />;
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={signedIn ? `Signed in as ${username}` : `Viewing as ${username}`}
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative flex items-center justify-center w-9 h-9 rounded-full border text-xs font-semibold tracking-wide transition-all duration-200 hover:brightness-125 ${open ? "ring-2 ring-brand/40" : ""}`}
        style={btnStyle}
      >
        {profileInitials(username)}
        {editMode && (
          <span data-testid="editing-dot" className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-zinc-900" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-1.5 flex flex-col gap-0.5"
        >
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span className="w-8 h-8 shrink-0 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold text-zinc-200">
              {profileInitials(username)}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 leading-tight">{signedIn ? "Signed in as" : "Viewing as"}</p>
              <p className="text-sm font-medium text-zinc-100 truncate">{username || "unknown"}</p>
            </div>
          </div>

          {(onToggleEdit || onMobileEditorToggle) && divider}

          {onToggleEdit && (
            <button
              role="menuitem"
              onClick={() => { onToggleEdit(); close(); }}
              className={`${itemCls} ${editMode ? "text-brand" : "text-zinc-300"}`}
            >
              <PencilIcon size={14} />
              <span>{editMode ? "Stop editing" : "Edit layout"}</span>
              {editMode && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
            </button>
          )}

          {onMobileEditorToggle && (
            <button
              role="menuitem"
              onClick={() => { onMobileEditorToggle(); close(); }}
              className={`${itemCls} ${mobileEditorOpen ? "text-zinc-100" : "text-zinc-300"}`}
            >
              <PhoneIcon size={14} />
              <span>{mobileEditorOpen ? "Close phone layout" : "Phone layout"}</span>
              {mobileEnabled && (
                <span title="Phone view is on" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>
          )}

          {links.length > 0 && divider}

          {links.map((tab) => {
            const Icon = LINK_ICONS[tab];
            return (
              <Link
                key={tab}
                role="menuitem"
                href={ADMIN_TAB_INFO[tab].href}
                onClick={close}
                className={`${itemCls} text-zinc-400 hover:text-zinc-200`}
              >
                <Icon size={14} />
                {ADMIN_TAB_INFO[tab].label}
              </Link>
            );
          })}

          {divider}

          {signedIn ? (
            <button
              role="menuitem"
              onClick={() => { close(); onLogout(); }}
              className={`${itemCls} text-red-400 hover:text-red-300`}
            >
              <LogOutIcon size={14} />
              <span>Sign out</span>
            </button>
          ) : (
            <Link
              role="menuitem"
              href="/login"
              onClick={close}
              className={`${itemCls} text-zinc-200`}
            >
              <LogInIcon size={14} />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
