"use client";

import { useActionState } from "react";
import {
  addUserAction,
  changeRoleAction,
  deleteUserAction,
  toggleDisabledAction,
  type UserActionState,
} from "@/app/admin/users/actions";
import type { PublicUser } from "@/lib/auth/users";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  Badge,
  EmptyRow,
  ICON_BTN_DANGER,
  INPUT,
  Notice,
  Panel,
  ROW,
  SELECT,
  SMALL_BTN,
  TD,
  TH,
  Table,
  TrashIcon,
} from "@/components/admin/admin-ui";

const INITIAL: UserActionState = {};

export interface UserAbilities {
  isAdmin: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
}

interface RoleRef {
  id: string;
  label: string;
}

function accountBadge(user: PublicUser) {
  if (user.isRoot) return <Badge label="Root admin" variant="amber" />;
  if (user.role === "admin") return <Badge label="Admin" variant="brand" />;
  return <Badge label="User" />;
}

function UserRow({
  user,
  roles,
  currentUsername,
  abilities,
}: {
  user: PublicUser;
  roles: RoleRef[];
  currentUsername: string;
  abilities: UserAbilities;
}) {
  const [toggleState, toggleAction, togglePending] = useActionState(toggleDisabledAction, INITIAL);
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, INITIAL);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteUserAction, INITIAL);

  const isSelf = user.username === currentUsername;
  // Mirrors the server's rules so we don't offer buttons that would be refused.
  const canTouch = !isSelf && (abilities.isAdmin || user.role !== "admin");
  const error = toggleState.error || roleState.error || deleteState.error;
  const roleLabels = (user.roles ?? []).map((id) => roles.find((r) => r.id === id)?.label ?? id);

  return (
    <tr className={ROW}>
      <td className={TD}>
        <div className="flex items-center gap-3">
          <Avatar name={user.username} />
          <div className="min-w-0">
            <p className="font-medium text-fg">
              {user.username}
              {isSelf && <span className="ml-1.5 text-xs text-fg-subtle font-normal">(you)</span>}
            </p>
            {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
          </div>
        </div>
      </td>
      <td className={TD}>{accountBadge(user)}</td>
      <td className={TD}>
        {user.role === "admin" ? (
          <span className="text-xs text-fg-subtle">Everything</span>
        ) : roleLabels.length ? (
          <div className="flex flex-wrap gap-1">
            {roleLabels.map((l) => <Badge key={l} label={l} />)}
          </div>
        ) : (
          <span className="text-xs text-fg-subtle">None</span>
        )}
      </td>
      <td className={TD}>
        {user.disabled ? <Badge label="Disabled" variant="red" /> : <Badge label="Active" variant="green" />}
      </td>
      <td className={`${TD} text-right`}>
        <div className="flex items-center justify-end gap-1.5">
          {abilities.update && canTouch && (
            <form action={toggleAction}>
              <input type="hidden" name="username" value={user.username} />
              <button type="submit" disabled={togglePending} className={SMALL_BTN}>
                {user.disabled ? "Enable" : "Disable"}
              </button>
            </form>
          )}
          {abilities.update && abilities.isAdmin && canTouch && !user.isRoot && (
            <form action={roleAction}>
              <input type="hidden" name="username" value={user.username} />
              <input type="hidden" name="role" value={user.role === "admin" ? "user" : "admin"} />
              <button type="submit" disabled={rolePending} className={SMALL_BTN}>
                {rolePending ? "…" : user.role === "admin" ? "Make user" : "Make admin"}
              </button>
            </form>
          )}
          {abilities.delete && canTouch && !user.isRoot && (
            <form
              action={deleteAction}
              onSubmit={(e) => {
                if (!confirm(`Delete ${user.username}? This can't be undone.`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="username" value={user.username} />
              <button type="submit" disabled={deletePending} className={ICON_BTN_DANGER} aria-label={`Delete ${user.username}`}>
                <TrashIcon />
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}

function AddUserForm({ isAdmin }: { isAdmin: boolean }) {
  const [state, action, pending] = useActionState(addUserAction, INITIAL);
  return (
    <form action={action} className="p-6 flex flex-col gap-4">
      <Notice error={state.error} success={state.success} />
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Username</span>
          <input name="username" type="text" placeholder="jane" autoComplete="off" className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Password</span>
          <input name="password" type="password" placeholder="8+ characters" autoComplete="new-password" className={INPUT} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Account</span>
          <select name="role" defaultValue="user" className={SELECT}>
            <option value="user">User</option>
            {isAdmin && <option value="admin">Admin</option>}
          </select>
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add user"}
        </Button>
      </div>
    </form>
  );
}

interface Props {
  users: PublicUser[];
  roles: RoleRef[];
  currentUsername: string;
  abilities: UserAbilities;
}

export default function UsersManager({ users, roles, currentUsername, abilities }: Props) {
  const active = users.filter((u) => !u.disabled).length;
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <>
      <Panel
        heading="Accounts"
        subheading={`${users.length} user${users.length === 1 ? "" : "s"} · ${active} active · ${admins} admin${admins === 1 ? "" : "s"}`}
      >
        <Table>
          <thead>
            <tr>
              <th className={TH}>User</th>
              <th className={TH}>Account</th>
              <th className={TH}>Roles</th>
              <th className={TH}>Status</th>
              <th className={`${TH} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <EmptyRow colSpan={5}>No users yet.</EmptyRow>
            ) : (
              users.map((u) => (
                <UserRow key={u.username} user={u} roles={roles} currentUsername={currentUsername} abilities={abilities} />
              ))
            )}
          </tbody>
        </Table>
      </Panel>

      {abilities.write && (
        <Panel heading="Add user" subheading={abilities.isAdmin ? undefined : "Only admins can create admin accounts."}>
          <AddUserForm isAdmin={abilities.isAdmin} />
        </Panel>
      )}
    </>
  );
}
