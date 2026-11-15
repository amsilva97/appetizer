"use client";

import { useActionState } from "react";
import {
  addUserAction,
  changeRoleAction,
  deleteUserAction,
  toggleDisabledAction,
  updateSettingsAction,
  type UserActionState,
} from "@/app/admin/users/actions";
import type { AppUser } from "@/lib/auth/users";
import type { AppSettings } from "@/lib/auth/settings";

const INITIAL: UserActionState = {};

const INPUT =
  "w-full h-10 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/25 " +
  "focus:border-brand/50 transition-colors";

const SELECT =
  "w-full h-10 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50 transition-colors";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function UsersEmptyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function Badge({ label, variant }: { label: string; variant: "neutral" | "amber" | "red" | "active" }) {
  const cls = {
    neutral: "text-fg-subtle bg-surface-2 border-line",
    amber:   "text-warning bg-warning/10 border-warning/20",
    red:     "text-danger bg-danger/10 border-danger/20",
    active:  "text-fg-muted bg-surface-2 border-line",
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function Panel({ heading, subheading, children }: { heading: string; subheading?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface/80 backdrop-blur border border-line overflow-hidden">
      <div className="px-6 py-4 border-b border-line">
        <p className="text-base font-semibold text-fg">{heading}</p>
        {subheading && <p className="text-sm text-fg-muted mt-0.5">{subheading}</p>}
      </div>
      {children}
    </div>
  );
}

function UserRow({ user, currentUsername }: { user: AppUser; currentUsername: string }) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleDisabledAction, INITIAL);
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteUserAction, INITIAL);

  const isSelf = user.username === currentUsername;
  const error = toggleState.error || roleState.error || deleteState.error;

  return (
    <li className="flex items-center gap-4 px-6 py-3 border-b border-line last:border-0">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-2 border border-line text-sm font-semibold text-fg shrink-0 select-none">
        {user.username.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-fg">{user.username}</span>
          {isSelf && <span className="text-xs text-fg-subtle">(you)</span>}
        </div>
        <p className="text-xs text-fg-muted mt-0.5">
          {user.disabled
            ? "Disabled"
            : user.isRoot
            ? "Root administrator"
            : user.role === "admin"
            ? "Administrator"
            : "Viewer — can view, cannot edit"}
        </p>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {user.isRoot && <Badge label="root" variant="amber" />}
        {user.role === "admin" && !user.isRoot && <Badge label="admin" variant="active" />}
        {user.disabled && <Badge label="disabled" variant="red" />}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <form action={toggleAction}>
          <input type="hidden" name="username" value={user.username} />
          <button
            type="submit"
            disabled={togglePending || isSelf}
            className="h-7 px-3 rounded-md text-xs font-medium text-fg-muted bg-surface-2 hover:bg-white/10 hover:text-fg disabled:opacity-30 transition-colors"
          >
            {user.disabled ? "Enable" : "Disable"}
          </button>
        </form>

        {!user.isRoot && !isSelf && (
          <form action={roleAction}>
            <input type="hidden" name="username" value={user.username} />
            <input type="hidden" name="role" value={user.role === "admin" ? "user" : "admin"} />
            <button
              type="submit"
              disabled={rolePending}
              className="h-7 px-3 rounded-md text-xs font-medium text-fg-muted bg-surface-2 hover:bg-white/10 hover:text-fg disabled:opacity-30 transition-colors"
            >
              {rolePending ? "…" : user.role === "admin" ? "Demote" : "Promote"}
            </button>
          </form>
        )}

        {!user.isRoot && !isSelf && (
          <form action={deleteAction}>
            <input type="hidden" name="username" value={user.username} />
            <button
              type="submit"
              disabled={deletePending}
              className="flex items-center justify-center w-7 h-7 rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10 disabled:opacity-30 transition-colors"
            >
              <TrashIcon />
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function SettingsPanel({ settings }: { settings: AppSettings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, INITIAL);
  return (
    <Panel heading="Access">
      <form action={action} className="px-6 py-5">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-fg">Force login</p>
            <p className="text-sm text-fg-muted mt-0.5">
              Visitors must sign in before seeing the dashboard.
            </p>
          </div>
          <input type="hidden" name="forceLogin" value={settings.forceLogin ? "false" : "true"} />
          <button
            type="submit"
            disabled={pending}
            aria-label={settings.forceLogin ? "Disable force login" : "Enable force login"}
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
              settings.forceLogin ? "bg-brand" : "bg-surface-2"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                settings.forceLogin ? "left-6 bg-bg" : "left-1 bg-fg-subtle"
              }`}
            />
          </button>
        </div>
        {state.error && <p className="text-xs text-danger mt-3">{state.error}</p>}
      </form>
    </Panel>
  );
}

interface Props {
  users: AppUser[];
  settings: AppSettings;
  currentUsername: string;
}

export default function UsersManager({ users, settings, currentUsername }: Props) {
  const [addState, addAction, addPending] = useActionState(addUserAction, INITIAL);

  return (
    <>
      <SettingsPanel settings={settings} />

      <Panel heading="Users">
        {users.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="flex justify-center mb-3 text-fg-subtle">
              <UsersEmptyIcon />
            </div>
            <p className="text-sm font-medium text-fg-muted">No users yet</p>
            <p className="text-xs text-fg-subtle mt-1">Add a user below to give someone access.</p>
          </div>
        ) : (
          <ul>
            {users.map((u) => (
              <UserRow key={u.username} user={u} currentUsername={currentUsername} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel heading="Add user">
        <form action={addAction} className="px-6 py-5 flex flex-col gap-4 max-w-sm">
          {addState.error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2.5">
              {addState.error}
            </p>
          )}
          {addState.success && (
            <p className="text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-2.5">
              {addState.success}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-muted">Username</label>
            <input name="username" type="text" placeholder="jane" className={INPUT} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-muted">Password</label>
            <input name="password" type="password" placeholder="••••••••" className={INPUT} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-muted">Role</label>
            <select name="role" defaultValue="user" className={SELECT}>
              <option value="user">User — can view, cannot edit</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={addPending}
              className="h-9 px-4 rounded-lg bg-brand text-zinc-950 text-sm font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addPending ? "Adding…" : "Add user"}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
