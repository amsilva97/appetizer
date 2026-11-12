"use client";

import Link from "next/link";
import type { UserRole } from "@/lib/auth/users";

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

function LogInIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

const ICON_BTN =
  "flex items-center justify-center w-9 h-9 rounded-xl text-zinc-500 border border-white/[0.08] " +
  "hover:bg-white/[0.08] hover:text-zinc-300 transition-all duration-200";

interface ToolbarProps {
  editMode: boolean;
  onToggleEdit: () => void;
  role?: UserRole | null;
  loggedIn?: boolean;
}

export default function Toolbar({ editMode, onToggleEdit, role, loggedIn }: ToolbarProps) {
  const isAdmin = role === "admin";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12 bg-zinc-900/80 backdrop-blur-md border-b border-white/[0.06] flex items-center px-6">
      <div className="flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mark.png" alt="Appetizer" className="h-8 w-auto" />
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <>
            <Link href="/admin/users" title="Users" className={ICON_BTN}>
              <UsersIcon size={15} />
            </Link>
            <Link href="/admin/keys" title="Keys" className={ICON_BTN}>
              <KeyIcon size={15} />
            </Link>

            <div className="w-px h-5 bg-white/[0.08] mx-1" />

            <button
              onClick={onToggleEdit}
              title={editMode ? "Stop editing" : "Edit"}
              className={editMode ? "flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 bg-white text-zinc-900 border-white/[0.08]" : ICON_BTN}
            >
              <PencilIcon size={15} />
            </button>
          </>
        )}

        {loggedIn ? (
          <button
            onClick={handleLogout}
            title="Sign out"
            className={ICON_BTN}
          >
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
