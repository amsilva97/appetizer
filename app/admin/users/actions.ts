"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { addUser, deleteUser, findUser, readUsers, updateUser, type UserRole } from "@/lib/auth/users";
import { readPermissionsConfig } from "@/lib/auth/permissions";
import { actionGuard } from "@/lib/auth/action-guard";
import { checkAssignRoles, checkGrantAdmin, checkGrantPermissions, checkTargetUser } from "@/lib/auth/grants";

export interface UserActionState {
  error?: string;
  success?: string;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

function revalidate() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/permissions");
}

export async function addUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const { viewer, error } = await actionGuard("users:write");
  if (!viewer) return { error };

  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const role = (formData.get("role") as string | null) ?? "user";

  if (!username) return { error: "Username is required" };
  if (username.length > 64) return { error: "Username max 64 characters" };
  if (!USERNAME_RE.test(username)) return { error: "Username: letters, digits, _ and - only" };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters" };
  if (role !== "admin" && role !== "user") return { error: "Invalid role" };
  if (role === "admin") {
    const denied = checkGrantAdmin(viewer);
    if (denied) return { error: denied };
  }

  if (findUser(username)) return { error: "Username already taken" };

  const passwordHash = await bcrypt.hash(password, 12);
  addUser({ username, passwordHash, role: role as UserRole, isRoot: false, disabled: false });

  revalidate();
  return { success: `User "${username}" added` };
}

export async function deleteUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const { viewer, error } = await actionGuard("users:delete");
  if (!viewer) return { error };

  const username = formData.get("username") as string;
  const target = findUser(username);
  if (!target) return { error: "User not found" };
  if (target.isRoot) return { error: "Root admin cannot be deleted" };
  if (username === viewer.username) return { error: "Cannot delete your own account" };
  const denied = checkTargetUser(viewer, target);
  if (denied) return { error: denied };

  deleteUser(username);
  revalidate();
  return { success: `User "${username}" deleted` };
}

export async function toggleDisabledAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const { viewer, error } = await actionGuard("users:update");
  if (!viewer) return { error };

  const username = formData.get("username") as string;
  const target = findUser(username);
  if (!target) return { error: "User not found" };
  if (username === viewer.username) return { error: "Cannot disable your own account" };
  const denied = checkTargetUser(viewer, target);
  if (denied) return { error: denied };

  if (!target.disabled && target.role === "admin") {
    const activeAdmins = readUsers().filter((u) => u.role === "admin" && !u.disabled);
    if (activeAdmins.length <= 1) return { error: "Cannot disable the last active admin" };
  }

  updateUser(username, { disabled: !target.disabled });
  revalidate();
  return {};
}

export async function changeRoleAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const { viewer, error } = await actionGuard("users:update");
  if (!viewer) return { error };
  const notAdmin = checkGrantAdmin(viewer);
  if (notAdmin) return { error: notAdmin };

  const username = formData.get("username") as string;
  const role = formData.get("role") as UserRole;
  const target = findUser(username);
  if (!target) return { error: "User not found" };
  if (target.isRoot) return { error: "Root admin role cannot be changed" };
  if (role !== "admin" && role !== "user") return { error: "Invalid role" };
  if (username === viewer.username) return { error: "Cannot change your own role" };

  // Prevent demoting the last active admin
  if (role === "user") {
    const activeAdmins = readUsers().filter((u) => u.role === "admin" && !u.disabled);
    if (activeAdmins.length <= 1) return { error: "Cannot demote the last active admin" };
  }

  updateUser(username, { role });
  revalidate();
  return {};
}

/**
 * Save the user access matrix: which roles and direct view permissions each
 * user holds. Only rows that changed are checked and written, and nothing is
 * written if any changed row is refused.
 */
export async function saveUserAccessAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const { viewer, error } = await actionGuard("users:update");
  if (!viewer) return { error };

  const config = readPermissionsConfig();
  const roleIds = new Set(config.roles.map((r) => r.id));
  const permIds = new Set(config.permissions.map((p) => p.id));
  const users = readUsers();

  const wanted = new Map<string, { roles: string[]; permissions: string[] }>();
  for (const username of formData.getAll("users") as string[]) {
    wanted.set(username, { roles: [], permissions: [] });
  }
  for (const entry of formData.getAll("grant") as string[]) {
    const [username, kind, id] = entry.split("|");
    const row = wanted.get(username);
    if (!row) continue;
    if (kind === "role" && roleIds.has(id)) row.roles.push(id);
    if (kind === "perm" && permIds.has(id)) row.permissions.push(id);
  }

  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  const updates = new Map<string, { roles: string[]; permissions: string[] }>();

  for (const [username, next] of wanted) {
    const target = users.find((u) => u.username === username);
    if (!target) return { error: `User "${username}" not found` };
    const before = { roles: target.roles ?? [], permissions: target.permissions ?? [] };
    if (same(before.roles, next.roles) && same(before.permissions, next.permissions)) continue;

    const denied =
      checkTargetUser(viewer, target) ??
      checkAssignRoles(viewer, config.roles, before.roles, next.roles) ??
      checkGrantPermissions(viewer, before.permissions, next.permissions);
    if (denied) return { error: `${username}: ${denied}` };
    updates.set(username, next);
  }

  if (updates.size === 0) return { success: "No changes" };
  for (const [username, next] of updates) updateUser(username, next);

  revalidate();
  return { success: `Updated ${updates.size} user${updates.size === 1 ? "" : "s"}` };
}
