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
import { Button } from "@/components/ui/button";

const INITIAL: PermissionActionState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "focus:border-brand/60 transition-colors";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Panel({ heading, subheading, children }: { heading: string; subheading?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface border border-line overflow-hidden">
      <div className="px-6 py-4 border-b border-line">
        <p className="text-base font-semibold text-fg">{heading}</p>
        {subheading && <p className="text-sm text-fg-muted mt-0.5">{subheading}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Permissions ───────────────────────────────────────────────────────────────

function PermissionRow({ perm }: { perm: Permission }) {
  const [state, action, pending] = useActionState(deletePermissionAction, INITIAL);
  return (
    <li className="flex items-center gap-4 px-6 py-3.5 border-b border-line last:border-0 hover:bg-white/[0.02]">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg">{perm.label}</p>
        <p className="text-xs font-mono text-fg-subtle mt-0.5">{perm.id}</p>
      </div>
      <form action={action}>
        <input type="hidden" name="id" value={perm.id} />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center size-8 rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10 disabled:opacity-30 transition-colors"
        >
          <TrashIcon />
        </button>
      </form>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </li>
  );
}

function PermissionsSection({ permissions }: { permissions: Permission[] }) {
  const [state, action, pending] = useActionState(addPermissionAction, INITIAL);

  return (
    <Panel
      heading="Permissions"
      subheading="Named access gates assigned to roles, users, widgets, and pages."
    >
      {permissions.length > 0 && (
        <ul className="border-b border-line">
          {permissions.map((p) => <PermissionRow key={p.id} perm={p} />)}
        </ul>
      )}
      <form action={action} className="p-6 flex flex-col gap-4 max-w-sm">
        {permissions.length === 0 && (
          <p className="text-sm text-fg-subtle">No permissions defined yet.</p>
        )}
        {state.error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2.5">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-2.5">{state.success}</p>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">Label</label>
          <input name="label" type="text" placeholder="Media Access" className={INPUT} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">
            ID <span className="text-fg-subtle font-normal">(optional — auto-generated from label)</span>
          </label>
          <input name="id" type="text" placeholder="media-access" className={INPUT} />
        </div>
        <div className="pt-1">
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add permission"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

// ── Roles ─────────────────────────────────────────────────────────────────────

function RoleRow({ role, allPermissions }: { role: Role; allPermissions: Permission[] }) {
  const [open, setOpen] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteRoleAction, INITIAL);
  const [updateState, updateAction] = useActionState(updateRolePermissionsAction, INITIAL);

  return (
    <li className="border-b border-line last:border-0">
      <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02]">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <span className="text-sm font-medium text-fg">{role.label}</span>
          <span className="text-xs font-mono text-fg-subtle">{role.id}</span>
          <span className="text-xs text-fg-subtle ml-auto mr-2">
            {role.permissions.length > 0
              ? `${role.permissions.length} permission${role.permissions.length !== 1 ? "s" : ""}`
              : "no permissions"}
          </span>
          <span className="text-fg-subtle shrink-0"><ChevronIcon open={open} /></span>
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={role.id} />
          <button
            type="submit"
            disabled={deletePending}
            className="flex items-center justify-center size-8 rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10 disabled:opacity-30 transition-colors"
          >
            <TrashIcon />
          </button>
        </form>
        {deleteState.error && <span className="text-xs text-danger">{deleteState.error}</span>}
      </div>

      {open && (
        <div className="bg-surface-2/50 border-t border-line px-6 py-5">
          <form action={updateAction} className="flex flex-col gap-3">
            <input type="hidden" name="roleId" value={role.id} />
            <p className="text-xs font-medium text-fg-muted mb-1">Permissions</p>
            {allPermissions.length === 0 ? (
              <p className="text-sm text-fg-subtle">No permissions defined yet.</p>
            ) : (
              allPermissions.map((p) => (
                <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={p.id}
                    defaultChecked={role.permissions.includes(p.id)}
                    className="accent-brand w-4 h-4 shrink-0"
                  />
                  <span className="text-sm text-fg">{p.label}</span>
                  <span className="text-xs font-mono text-fg-subtle">{p.id}</span>
                </label>
              ))
            )}
            {updateState.error && <p className="text-sm text-danger mt-1">{updateState.error}</p>}
            {updateState.success && <p className="text-sm text-success mt-1">{updateState.success}</p>}
            <div className="pt-1">
              <Button type="submit" variant="secondary" size="default">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </li>
  );
}

function RolesSection({ roles, allPermissions }: { roles: Role[]; allPermissions: Permission[] }) {
  const [state, action, pending] = useActionState(addRoleAction, INITIAL);

  return (
    <Panel
      heading="Roles"
      subheading="Group permissions into roles, then assign roles to users."
    >
      {roles.length > 0 && (
        <ul className="border-b border-line">
          {roles.map((r) => <RoleRow key={r.id} role={r} allPermissions={allPermissions} />)}
        </ul>
      )}
      <form action={action} className="p-6 flex flex-col gap-4 max-w-sm">
        {roles.length === 0 && (
          <p className="text-sm text-fg-subtle">No roles defined yet.</p>
        )}
        {state.error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2.5">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-2.5">{state.success}</p>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">Label</label>
          <input name="label" type="text" placeholder="Media User" className={INPUT} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">
            ID <span className="text-fg-subtle font-normal">(optional)</span>
          </label>
          <input name="id" type="text" placeholder="media-user" className={INPUT} />
        </div>
        <div className="pt-1">
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add role"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

// ── User assignments ──────────────────────────────────────────────────────────

function UserRoleRow({ user, allRoles, allPermissions }: { user: AppUser; allRoles: Role[]; allPermissions: Permission[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateUserRolesAction, INITIAL);

  const userRoles = user.roles ?? [];
  const userPerms = user.permissions ?? [];

  return (
    <li className="border-b border-line last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-4 px-6 py-3.5 w-full text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center justify-center size-8 rounded-full bg-surface-2 border border-line text-sm font-medium text-fg-muted shrink-0 select-none">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg">{user.username}</p>
          {userRoles.length > 0 && (
            <p className="text-xs text-fg-muted mt-0.5">{userRoles.join(", ")}</p>
          )}
        </div>
        <span className="text-fg-subtle shrink-0"><ChevronIcon open={open} /></span>
      </button>

      {open && (
        <div className="bg-surface-2/50 border-t border-line px-6 py-5">
          <form action={action} className="flex flex-col gap-5">
            <input type="hidden" name="username" value={user.username} />

            {allRoles.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-fg-muted">Roles</p>
                {allRoles.map((r) => (
                  <label key={r.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="roles"
                      value={r.id}
                      defaultChecked={userRoles.includes(r.id)}
                      className="accent-brand w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-fg">{r.label}</span>
                    <span className="text-xs font-mono text-fg-subtle">{r.id}</span>
                  </label>
                ))}
              </div>
            )}

            {allPermissions.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-fg-muted">Direct permissions</p>
                {allPermissions.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="permissions"
                      value={p.id}
                      defaultChecked={userPerms.includes(p.id)}
                      className="accent-brand w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-fg">{p.label}</span>
                    <span className="text-xs font-mono text-fg-subtle">{p.id}</span>
                  </label>
                ))}
              </div>
            )}

            {allRoles.length === 0 && allPermissions.length === 0 && (
              <p className="text-sm text-fg-subtle">No roles or permissions defined yet.</p>
            )}

            {state.error && <p className="text-sm text-danger">{state.error}</p>}
            {state.success && <p className="text-sm text-success">{state.success}</p>}

            <div>
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}
    </li>
  );
}

function UsersSection({ users, allRoles, allPermissions }: { users: AppUser[]; allRoles: Role[]; allPermissions: Permission[] }) {
  const nonRootUsers = users.filter((u) => !u.isRoot);
  return (
    <Panel
      heading="User assignments"
      subheading="Assign roles and direct permissions to individual users."
    >
      {nonRootUsers.length === 0 ? (
        <p className="px-6 py-5 text-sm text-fg-subtle">No non-root users to assign.</p>
      ) : (
        <ul>
          {nonRootUsers.map((u) => (
            <UserRoleRow key={u.username} user={u} allRoles={allRoles} allPermissions={allPermissions} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  config: PermissionsConfig;
  users: AppUser[];
}

export default function PermissionsManager({ config, users }: Props) {
  return (
    <>
      <PermissionsSection permissions={config.permissions} />
      <RolesSection roles={config.roles} allPermissions={config.permissions} />
      <UsersSection users={users} allRoles={config.roles} allPermissions={config.permissions} />
    </>
  );
}
