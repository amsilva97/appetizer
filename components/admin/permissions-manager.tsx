"use client";

import { useState, useActionState } from "react";
import {
  addPermissionAction,
  addRoleAction,
  deletePermissionAction,
  deleteRoleAction,
  updateRolePermissionsAction,
  updateUserRolesAction,
  type PermissionActionState,
} from "@/app/admin/permissions/actions";
import type { PermissionsConfig, Permission, Role } from "@/types/permissions";
import type { AppUser } from "@/lib/auth/users";

const INITIAL: PermissionActionState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg " +
  "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/25 " +
  "focus:border-brand/50 transition-colors";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Permissions section ───────────────────────────────────────────────────────

function PermissionRow({ perm }: { perm: Permission }) {
  const [state, action, pending] = useActionState(deletePermissionAction, INITIAL);
  return (
    <li className="flex items-center gap-3 px-4 py-3 bg-zinc-900">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm text-zinc-100 leading-tight">{perm.label}</span>
        <span className="text-[10px] text-zinc-600 font-mono">{perm.id}</span>
      </div>
      <form action={action}>
        <input type="hidden" name="id" value={perm.id} />
        <button
          type="submit"
          disabled={pending}
          title={`Delete ${perm.id}`}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
        >
          <TrashIcon />
        </button>
      </form>
      {state.error && <span className="text-[11px] text-red-400">{state.error}</span>}
    </li>
  );
}

function PermissionsSection({ permissions }: { permissions: Permission[] }) {
  const [state, action, pending] = useActionState(addPermissionAction, INITIAL);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-300">Permissions</h2>
      <p className="text-xs text-zinc-500">
        Named access gates. Assign them to roles, users, widgets, and pages.
      </p>

      {permissions.length > 0 ? (
        <ul className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
          {permissions.map((p) => <PermissionRow key={p.id} perm={p} />)}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600">No permissions defined yet.</p>
      )}

      <form action={action} className="flex flex-col gap-3 pt-2">
        {state.error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{state.error}</p>
        )}
        {state.success && (
          <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{state.success}</p>
        )}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Label</p>
            <input name="label" type="text" placeholder="Media Access" className={INPUT} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">ID (optional)</p>
            <input name="id" type="text" placeholder="media-access" className={INPUT} />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="self-start h-9 px-4 rounded-lg bg-brand text-zinc-950 text-sm font-semibold hover:bg-brand/80 disabled:opacity-50 transition-colors"
        >
          {pending ? "Adding…" : "Add permission"}
        </button>
      </form>
    </div>
  );
}

// ── Roles section ─────────────────────────────────────────────────────────────

function RoleRow({ role, allPermissions }: { role: Role; allPermissions: Permission[] }) {
  const [open, setOpen] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteRoleAction, INITIAL);
  const [updateState, updateAction] = useActionState(updateRolePermissionsAction, INITIAL);

  return (
    <li className="bg-zinc-900">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className="text-sm text-zinc-100 leading-tight">{role.label}</span>
          <span className="text-[10px] text-zinc-600 font-mono ml-1">{role.id}</span>
          <span className="ml-auto text-zinc-600"><ChevronIcon open={open} /></span>
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={role.id} />
          <button
            type="submit"
            disabled={deletePending}
            title={`Delete ${role.id}`}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
          >
            <TrashIcon />
          </button>
        </form>
        {deleteState.error && <span className="text-[11px] text-red-400">{deleteState.error}</span>}
      </div>

      {open && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Permissions</p>
          <form action={updateAction} className="flex flex-col gap-2">
            <input type="hidden" name="roleId" value={role.id} />
            {allPermissions.length === 0 ? (
              <p className="text-xs text-zinc-600">No permissions defined.</p>
            ) : (
              allPermissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={p.id}
                    defaultChecked={role.permissions.includes(p.id)}
                    className="accent-brand"
                  />
                  <span className="text-sm text-zinc-200">{p.label}</span>
                  <span className="text-[10px] text-zinc-600 font-mono">{p.id}</span>
                </label>
              ))
            )}
            {updateState.error && <p className="text-xs text-red-400 mt-1">{updateState.error}</p>}
            {updateState.success && <p className="text-xs text-green-400 mt-1">{updateState.success}</p>}
            <button
              type="submit"
              className="self-start mt-1 h-7 px-3 rounded-lg bg-brand/15 text-brand border border-brand/30 text-xs font-medium hover:bg-brand/25 transition-colors"
            >
              Save
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function RolesSection({ roles, allPermissions }: { roles: Role[]; allPermissions: Permission[] }) {
  const [state, action, pending] = useActionState(addRoleAction, INITIAL);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-300">Roles</h2>
      <p className="text-xs text-zinc-500">Group permissions into roles and assign roles to users.</p>

      {roles.length > 0 ? (
        <ul className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
          {roles.map((r) => <RoleRow key={r.id} role={r} allPermissions={allPermissions} />)}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600">No roles defined yet.</p>
      )}

      <form action={action} className="flex flex-col gap-3 pt-2">
        {state.error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{state.error}</p>
        )}
        {state.success && (
          <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{state.success}</p>
        )}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Label</p>
            <input name="label" type="text" placeholder="Media User" className={INPUT} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">ID (optional)</p>
            <input name="id" type="text" placeholder="media-user" className={INPUT} />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="self-start h-9 px-4 rounded-lg bg-brand text-zinc-950 text-sm font-semibold hover:bg-brand/80 disabled:opacity-50 transition-colors"
        >
          {pending ? "Adding…" : "Add role"}
        </button>
      </form>
    </div>
  );
}

// ── User assignment section ───────────────────────────────────────────────────

function UserRoleRow({ user, allRoles, allPermissions }: { user: AppUser; allRoles: Role[]; allPermissions: Permission[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateUserRolesAction, INITIAL);

  const userRoles = user.roles ?? [];
  const userPerms = user.permissions ?? [];

  return (
    <li className="bg-zinc-900">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className="text-sm text-zinc-100">{user.username}</span>
          {userRoles.length > 0 && (
            <span className="text-[10px] text-zinc-500 font-mono">{userRoles.join(", ")}</span>
          )}
          <span className="ml-auto text-zinc-600"><ChevronIcon open={open} /></span>
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="username" value={user.username} />

            {allRoles.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Roles</p>
                {allRoles.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="roles"
                      value={r.id}
                      defaultChecked={userRoles.includes(r.id)}
                      className="accent-brand"
                    />
                    <span className="text-sm text-zinc-200">{r.label}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{r.id}</span>
                  </label>
                ))}
              </div>
            )}

            {allPermissions.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Direct permissions</p>
                {allPermissions.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="permissions"
                      value={p.id}
                      defaultChecked={userPerms.includes(p.id)}
                      className="accent-brand"
                    />
                    <span className="text-sm text-zinc-200">{p.label}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{p.id}</span>
                  </label>
                ))}
              </div>
            )}

            {allRoles.length === 0 && allPermissions.length === 0 && (
              <p className="text-xs text-zinc-600">No roles or permissions defined yet.</p>
            )}

            {state.error && <p className="text-xs text-red-400">{state.error}</p>}
            {state.success && <p className="text-xs text-green-400">{state.success}</p>}

            <button
              type="submit"
              className="self-start h-7 px-3 rounded-lg bg-brand/15 text-brand border border-brand/30 text-xs font-medium hover:bg-brand/25 transition-colors"
            >
              Save
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function UsersSection({ users, allRoles, allPermissions }: { users: AppUser[]; allRoles: Role[]; allPermissions: Permission[] }) {
  const nonAdminUsers = users.filter((u) => !u.isRoot);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-300">User assignments</h2>
      <p className="text-xs text-zinc-500">Assign roles and direct permissions to individual users.</p>
      {nonAdminUsers.length === 0 ? (
        <p className="text-sm text-zinc-600">No non-root users.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
          {nonAdminUsers.map((u) => (
            <UserRoleRow key={u.username} user={u} allRoles={allRoles} allPermissions={allPermissions} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  config: PermissionsConfig;
  users: AppUser[];
}

export default function PermissionsManager({ config, users }: Props) {
  return (
    <div className="flex flex-col gap-10 max-w-lg">
      <PermissionsSection permissions={config.permissions} />
      <RolesSection roles={config.roles} allPermissions={config.permissions} />
      <UsersSection users={users} allRoles={config.roles} allPermissions={config.permissions} />
    </div>
  );
}
