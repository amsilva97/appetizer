"use client";

import { useActionState, useState } from "react";
import {
  addPermissionAction,
  addRoleAction,
  deletePermissionAction,
  deleteRoleAction,
  saveRoleMatrixAction,
  type PermissionActionState,
} from "@/app/admin/permissions/actions";
import { saveUserAccessAction, type UserActionState } from "@/app/admin/users/actions";
import type { Capability, PermissionsConfig, Role } from "@/types/permissions";
import type { PublicUser } from "@/lib/auth/users";
import type { EffectiveAccess } from "@/lib/auth/effective";
import { Button } from "@/components/ui/button";
import {
  Badge,
  EmptyRow,
  ICON_BTN_DANGER,
  INPUT,
  Notice,
  Panel,
  ROW,
  TD,
  TH,
  Table,
  TrashIcon,
} from "@/components/admin/admin-ui";
import {
  CAPABILITY_COLUMNS,
  CELL,
  CHECKBOX,
  MatrixHeader,
  MatrixLegend,
  Mark,
  NotApplicable,
  STICKY_TD,
  groupEdge,
} from "@/components/admin/matrix";

const INITIAL: PermissionActionState = {};
const INITIAL_USER: UserActionState = {};

export interface PermissionAbilities {
  username: string;
  isAdmin: boolean;
  /** Capabilities the viewer holds; partial admins can only grant these. */
  held: Capability[];
  rolesWrite: boolean;
  rolesUpdate: boolean;
  rolesDelete: boolean;
  usersRead: boolean;
  usersUpdate: boolean;
}

export interface PermissionUsage {
  roles: number;
  users: number;
  pages: number;
}

// ── Role matrix ───────────────────────────────────────────────────────────────

function RoleMatrix({ config, abilities }: { config: PermissionsConfig; abilities: PermissionAbilities }) {
  const [state, action, pending] = useActionState(saveRoleMatrixAction, INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteRoleAction, INITIAL);
  const [addState, addAction, addPending] = useActionState(addRoleAction, INITIAL);
  const [dirty, setDirty] = useState(false);
  const held = new Set(abilities.held);
  const { roles, permissions } = config;

  // Partial admins can only tick or untick capabilities they hold themselves.
  const capEditable = (cap: Capability) => abilities.rolesUpdate && (abilities.isAdmin || held.has(cap));

  return (
    <Panel
      heading="Roles"
      subheading="What each role grants: admin areas (read, write, update, delete) and which pages and widgets holders can see."
      actions={
        abilities.rolesUpdate && roles.length > 0 ? (
          <>
            {dirty && <span className="text-xs text-warning">Unsaved changes</span>}
            <Button type="submit" form="role-matrix" disabled={pending || !dirty} size="sm">
              {pending ? "Saving…" : "Save roles"}
            </Button>
          </>
        ) : undefined
      }
    >
      {(state.error || state.success || deleteState.error || deleteState.success) && (
        <div className="px-6 pt-4">
          <Notice error={state.error ?? deleteState.error} success={state.success ?? deleteState.success} />
        </div>
      )}

      {/* Delete buttons in the table submit this form, so the forms aren't nested. */}
      <form id="delete-role" action={deleteAction} />

      <form
        id="role-matrix"
        key={JSON.stringify(roles)}
        action={async (fd) => {
          await action(fd);
          setDirty(false);
        }}
        onChange={() => setDirty(true)}
      >
        {roles.map((r) => <input key={r.id} type="hidden" name="roles" value={r.id} />)}
        <Table>
          <MatrixHeader rowLabel="Role" permissions={permissions} />
          <tbody>
            {roles.length === 0 ? (
              <EmptyRow colSpan={1 + CAPABILITY_COLUMNS.length + permissions.length}>No roles yet. Add one below.</EmptyRow>
            ) : (
              roles.map((role) => (
                <RoleMatrixRow
                  key={role.id}
                  role={role}
                  permissions={permissions.map((p) => p.id)}
                  capEditable={capEditable}
                  permEditable={abilities.rolesUpdate}
                  canDelete={abilities.rolesDelete && (abilities.isAdmin || (role.capabilities ?? []).every((c) => held.has(c)))}
                  deletePending={deletePending}
                />
              ))
            )}
          </tbody>
        </Table>
      </form>
      <MatrixLegend />

      {abilities.rolesWrite && (
        <form action={addAction} className="px-6 py-4 border-t border-line flex flex-col gap-3">
          <Notice error={addState.error} success={addState.success} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 w-56">
              <span className="text-xs font-medium text-fg-muted">New role</span>
              <input name="label" type="text" placeholder="Media manager" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5 w-44">
              <span className="text-xs font-medium text-fg-muted">ID (optional)</span>
              <input name="id" type="text" placeholder="media-manager" className={INPUT} />
            </label>
            <Button type="submit" variant="secondary" disabled={addPending}>
              {addPending ? "Adding…" : "Add role"}
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}

function RoleMatrixRow({
  role,
  permissions,
  capEditable,
  permEditable,
  canDelete,
  deletePending,
}: {
  role: Role;
  permissions: string[];
  capEditable: (cap: Capability) => boolean;
  permEditable: boolean;
  canDelete: boolean;
  deletePending: boolean;
}) {
  const caps = new Set(role.capabilities ?? []);
  return (
    <tr className={ROW}>
      <td className={STICKY_TD}>
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">{role.label}</p>
            <p className="text-xs font-mono text-fg-subtle">{role.id}</p>
          </div>
          {canDelete && (
            <button
              type="submit"
              form="delete-role"
              name="id"
              value={role.id}
              disabled={deletePending}
              className={`${ICON_BTN_DANGER} ml-auto`}
              aria-label={`Delete role ${role.label}`}
              onClick={(e) => {
                if (!confirm(`Delete role "${role.label}"? Users lose what it grants.`)) e.preventDefault();
              }}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </td>
      {CAPABILITY_COLUMNS.map(({ cap, help }, i) =>
        help ? (
          <td key={cap} className={`${CELL} ${groupEdge(i)}`}>
            <input
              type="checkbox"
              name="grant"
              value={`${role.id}|cap|${cap}`}
              defaultChecked={caps.has(cap)}
              disabled={!capEditable(cap)}
              aria-label={`${role.label}: ${cap}`}
              className={CHECKBOX}
            />
            {/* Disabled boxes aren't submitted; keep what they hold. */}
            {!capEditable(cap) && caps.has(cap) && <input type="hidden" name="grant" value={`${role.id}|cap|${cap}`} />}
          </td>
        ) : (
          <NotApplicable key={cap} edge={groupEdge(i)} />
        )
      )}
      {permissions.map((p, i) => (
        <td key={p} className={`${CELL} ${i === 0 ? "border-l border-line" : ""}`}>
          <input
            type="checkbox"
            name="grant"
            value={`${role.id}|perm|${p}`}
            defaultChecked={role.permissions.includes(p)}
            disabled={!permEditable}
            aria-label={`${role.label}: view ${p}`}
            className={CHECKBOX}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Permissions list ──────────────────────────────────────────────────────────

function PermissionsTable({
  config,
  usage,
  abilities,
}: {
  config: PermissionsConfig;
  usage: Record<string, PermissionUsage>;
  abilities: PermissionAbilities;
}) {
  const [state, action, pending] = useActionState(addPermissionAction, INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deletePermissionAction, INITIAL);

  return (
    <Panel
      heading="View permissions"
      subheading="Tags you put on pages and widgets. Someone sees a page or widget only if they hold every tag on it."
    >
      {(deleteState.error || deleteState.success) && (
        <div className="px-6 pt-4"><Notice error={deleteState.error} success={deleteState.success} /></div>
      )}
      <Table>
        <thead>
          <tr>
            <th className={TH}>Permission</th>
            <th className={TH}>ID</th>
            <th className={`${TH} text-right`}>Roles</th>
            <th className={`${TH} text-right`}>Users</th>
            <th className={`${TH} text-right`}>Pages</th>
            <th className={TH}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {config.permissions.length === 0 ? (
            <EmptyRow colSpan={6}>No permissions yet.</EmptyRow>
          ) : (
            config.permissions.map((p) => {
              const u = usage[p.id] ?? { roles: 0, users: 0, pages: 0 };
              return (
                <tr key={p.id} className={ROW}>
                  <td className={`${TD} font-medium text-fg`}>{p.label}</td>
                  <td className={`${TD} font-mono text-xs text-fg-subtle`}>{p.id}</td>
                  <td className={`${TD} text-right tabular-nums text-fg-muted`}>{u.roles}</td>
                  <td className={`${TD} text-right tabular-nums text-fg-muted`}>{u.users}</td>
                  <td className={`${TD} text-right tabular-nums text-fg-muted`}>{u.pages}</td>
                  <td className={`${TD} text-right w-12`}>
                    {abilities.rolesDelete && (
                      <form
                        action={deleteAction}
                        onSubmit={(e) => {
                          if (!confirm(`Delete "${p.label}"? It's removed from every role and user.`)) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" disabled={deletePending} className={ICON_BTN_DANGER} aria-label={`Delete ${p.label}`}>
                          <TrashIcon />
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
      {abilities.rolesWrite && (
        <form action={action} className="px-6 py-4 border-t border-line flex flex-col gap-3">
          <Notice error={state.error} success={state.success} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 w-56">
              <span className="text-xs font-medium text-fg-muted">New permission</span>
              <input name="label" type="text" placeholder="Media access" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5 w-44">
              <span className="text-xs font-medium text-fg-muted">ID (optional)</span>
              <input name="id" type="text" placeholder="media" className={INPUT} />
            </label>
            <Button type="submit" variant="secondary" disabled={pending}>
              {pending ? "Adding…" : "Add permission"}
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}

// ── User access ───────────────────────────────────────────────────────────────

function UserAccessMatrix({
  config,
  users,
  abilities,
}: {
  config: PermissionsConfig;
  users: PublicUser[];
  abilities: PermissionAbilities;
}) {
  const [state, action, pending] = useActionState(saveUserAccessAction, INITIAL_USER);
  const [dirty, setDirty] = useState(false);
  const held = new Set(abilities.held);
  const people = users.filter((u) => u.role !== "admin");
  // Matches the server: partial admins can't change their own access.
  const editable = (u: PublicUser) => abilities.usersUpdate && (abilities.isAdmin || u.username !== abilities.username);
  // A role you can newly grant: you hold everything it includes.
  const grantable = (r: Role) => abilities.isAdmin || (r.capabilities ?? []).every((c) => held.has(c));

  const cols = config.roles.length + config.permissions.length;

  return (
    <Panel
      heading="User access"
      subheading="Give people roles, or view permissions directly. Admins have everything and aren't listed."
      actions={
        abilities.usersUpdate && people.length > 0 && cols > 0 ? (
          <>
            {dirty && <span className="text-xs text-warning">Unsaved changes</span>}
            <Button type="submit" form="user-access" disabled={pending || !dirty} size="sm">
              {pending ? "Saving…" : "Save access"}
            </Button>
          </>
        ) : undefined
      }
    >
      {(state.error || state.success) && (
        <div className="px-6 pt-4"><Notice error={state.error} success={state.success} /></div>
      )}
      <form
        id="user-access"
        key={JSON.stringify(people.map((u) => [u.username, u.roles, u.permissions]))}
        action={async (fd) => {
          await action(fd);
          setDirty(false);
        }}
        onChange={() => setDirty(true)}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-r border-line">
                  User
                </th>
                {config.roles.map((r, i) => (
                  <th key={r.id} title={r.id} className={`px-3 py-2 text-xs font-medium text-fg-muted border-b border-line whitespace-nowrap text-center ${i === 0 ? "border-l" : ""}`}>
                    {r.label}
                    <span className="block text-[10px] uppercase tracking-wider text-fg-subtle">role</span>
                  </th>
                ))}
                {config.permissions.map((p, i) => (
                  <th key={p.id} title={p.id} className={`px-3 py-2 text-xs font-medium text-fg-muted border-b border-line whitespace-nowrap text-center ${i === 0 ? "border-l" : ""}`}>
                    {p.label}
                    <span className="block text-[10px] uppercase tracking-wider text-fg-subtle">view</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.length === 0 ? (
                <EmptyRow colSpan={1 + cols}>No non-admin users.</EmptyRow>
              ) : cols === 0 ? (
                <EmptyRow colSpan={1}>Create roles or permissions first.</EmptyRow>
              ) : (
                people.map((u) => {
                  const roles = u.roles ?? [];
                  const perms = u.permissions ?? [];
                  return (
                    <tr key={u.username} className={ROW}>
                      <td className={STICKY_TD}>
                        <input type="hidden" name="users" value={u.username} />
                        <span className="font-medium text-fg">{u.username}</span>
                        {u.disabled && <span className="ml-2"><Badge label="Disabled" variant="red" /></span>}
                      </td>
                      {config.roles.map((r, i) => {
                        const has = roles.includes(r.id);
                        // You can always take a role away; adding needs you to hold what it grants.
                        const disabled = !editable(u) || (!has && !grantable(r));
                        return (
                          <td key={r.id} className={`${CELL} ${i === 0 ? "border-l border-line" : ""}`}>
                            <input
                              type="checkbox"
                              name="grant"
                              value={`${u.username}|role|${r.id}`}
                              defaultChecked={has}
                              disabled={disabled}
                              title={disabled && !has ? "Grants things you don't hold" : undefined}
                              aria-label={`${u.username}: role ${r.label}`}
                              className={CHECKBOX}
                            />
                            {disabled && has && <input type="hidden" name="grant" value={`${u.username}|role|${r.id}`} />}
                          </td>
                        );
                      })}
                      {config.permissions.map((p, i) => (
                        <td key={p.id} className={`${CELL} ${i === 0 ? "border-l border-line" : ""}`}>
                          <input
                            type="checkbox"
                            name="grant"
                            value={`${u.username}|perm|${p.id}`}
                            defaultChecked={perms.includes(p.id)}
                            disabled={!editable(u)}
                            aria-label={`${u.username}: view ${p.label}`}
                            className={CHECKBOX}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </form>
    </Panel>
  );
}

// ── Effective access ──────────────────────────────────────────────────────────

function EffectiveAccessMatrix({ rows, config }: { rows: EffectiveAccess[]; config: PermissionsConfig }) {
  return (
    <Panel
      heading="Who can do what"
      subheading="Everything each person ends up with, from their account type, roles and direct grants. Hover a dot to see where it comes from. Admin rights also depend on the IP allowlist in Settings."
    >
      <Table>
        <MatrixHeader rowLabel="User" permissions={config.permissions} />
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={1 + CAPABILITY_COLUMNS.length + config.permissions.length}>No users.</EmptyRow>
          ) : (
            rows.map((r) => (
              <tr key={r.username} className={`${ROW} ${r.disabled ? "opacity-50" : ""}`}>
                <td className={STICKY_TD}>
                  <span className="font-medium text-fg">{r.username}</span>
                  <span className="ml-2">
                    {r.isAdmin ? <Badge label="Admin" variant="brand" /> : r.disabled ? <Badge label="Disabled" variant="red" /> : null}
                  </span>
                </td>
                {CAPABILITY_COLUMNS.map(({ cap, help }, i) =>
                  help ? (
                    <Mark key={cap} on={!r.disabled && cap in r.capabilities} source={r.capabilities[cap]} edge={groupEdge(i)} />
                  ) : (
                    <NotApplicable key={cap} edge={groupEdge(i)} />
                  )
                )}
                {config.permissions.map((p, i) => (
                  <Mark
                    key={p.id}
                    on={!r.disabled && (r.isAdmin || p.id in r.permissions)}
                    source={r.isAdmin ? "admin" : r.permissions[p.id]}
                    edge={i === 0 ? "border-l border-line" : ""}
                  />
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <MatrixLegend />
    </Panel>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  config: PermissionsConfig;
  users: PublicUser[];
  effective: EffectiveAccess[];
  usage: Record<string, PermissionUsage>;
  abilities: PermissionAbilities;
}

export default function PermissionsManager({ config, users, effective, usage, abilities }: Props) {
  return (
    <>
      <RoleMatrix config={config} abilities={abilities} />
      <PermissionsTable config={config} usage={usage} abilities={abilities} />
      {abilities.usersRead && <UserAccessMatrix config={config} users={users} abilities={abilities} />}
      {abilities.usersRead && <EffectiveAccessMatrix rows={effective} config={config} />}
    </>
  );
}
