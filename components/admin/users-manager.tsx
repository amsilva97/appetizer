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
  "w-full h-9 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg " +
  "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/25 " +
  "focus:border-brand/50 transition-colors";

const SELECT =
  "h-9 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg " +
  "focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/50 transition-colors";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function Badge({ label, color }: { label: string; color: "zinc" | "amber" | "blue" | "red" }) {
  const cls = {
    zinc:  "bg-zinc-800 text-zinc-400 border-zinc-700",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    blue:  "bg-blue-500/10 text-blue-400 border-blue-500/30",
    red:   "bg-red-500/10 text-red-400 border-red-500/30",
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>
      {label}
    </span>
  );
}

function UserRow({ user, currentUsername }: { user: AppUser; currentUsername: string }) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleDisabledAction, INITIAL);
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteUserAction, INITIAL);

  const isSelf = user.username === currentUsername;
  const error = toggleState.error || roleState.error || deleteState.error;

  return (
    <li className="flex flex-col gap-1 px-4 py-3 bg-zinc-900">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-zinc-100 min-w-0 shrink-0">{user.username}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {user.isRoot && <Badge label="Root" color="amber" />}
          <Badge label={user.role} color={user.role === "admin" ? "blue" : "zinc"} />
          {user.disabled && <Badge label="Disabled" color="red" />}
          {isSelf && <Badge label="You" color="zinc" />}
        </div>
        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
          {/* Toggle disabled */}
          <form action={toggleAction}>
            <input type="hidden" name="username" value={user.username} />
            <button
              type="submit"
              disabled={togglePending || isSelf}
              title={user.disabled ? "Enable" : "Disable"}
              className="h-7 px-2.5 rounded-lg text-[11px] font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors"
            >
              {user.disabled ? "Enable" : "Disable"}
            </button>
          </form>

          {/* Change role (not for root, not for self) */}
          {!user.isRoot && !isSelf && (
            <form action={roleAction} className="flex items-center gap-1">
              <input type="hidden" name="username" value={user.username} />
              <input type="hidden" name="role" value={user.role === "admin" ? "user" : "admin"} />
              <button
                type="submit"
                disabled={rolePending}
                className="h-7 px-2.5 rounded-lg text-[11px] font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              >
                {rolePending ? "…" : user.role === "admin" ? "Demote" : "Promote"}
              </button>
            </form>
          )}

          {/* Delete (not for root, not for self) */}
          {!user.isRoot && !isSelf && (
            <form action={deleteAction}>
              <input type="hidden" name="username" value={user.username} />
              <button
                type="submit"
                disabled={deletePending}
                title={`Delete ${user.username}`}
                className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
              >
                <TrashIcon />
              </button>
            </form>
          )}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-400 pl-0.5">{error}</p>}
    </li>
  );
}

function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, action, pending] = useActionState(updateSettingsAction, INITIAL);
  return (
    <form action={action} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-300">Access settings</h2>
      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-zinc-200">Force login</span>
          <span className="text-xs text-zinc-500">
            When on, visitors must sign in before seeing the homepage.
          </span>
        </div>
        <input type="hidden" name="forceLogin" value={settings.forceLogin ? "false" : "true"} />
        <button
          type="submit"
          disabled={pending}
          aria-label={settings.forceLogin ? "Disable force login" : "Enable force login"}
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
            settings.forceLogin ? "bg-brand" : "bg-zinc-700"
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
              settings.forceLogin ? "left-6 bg-zinc-950" : "left-1 bg-zinc-400"
            }`}
          />
        </button>
      </div>
      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
    </form>
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
    <div className="flex flex-col gap-8 max-w-lg">
      <SettingsForm settings={settings} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-300">Users</h2>
        {users.length === 0 ? (
          <p className="text-sm text-zinc-500">No users.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
            {users.map((u) => (
              <UserRow key={u.username} user={u} currentUsername={currentUsername} />
            ))}
          </ul>
        )}
      </div>

      <form action={addAction} className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-300">Add user</h2>

        {addState.error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {addState.error}
          </p>
        )}
        {addState.success && (
          <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            {addState.success}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Username</p>
          <input name="username" type="text" placeholder="jane" className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Password</p>
          <input name="password" type="password" placeholder="••••••••" className={INPUT} />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Role</p>
          <select name="role" defaultValue="user" className={SELECT}>
            <option value="user">User — can view, cannot edit</option>
            <option value="admin">Admin — can edit and manage users</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={addPending}
          className="self-start h-9 px-4 rounded-lg bg-brand text-zinc-950 text-sm font-semibold hover:bg-brand/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {addPending ? "Adding…" : "Add user"}
        </button>
      </form>
    </div>
  );
}
