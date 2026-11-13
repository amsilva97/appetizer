"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { readPermissionsConfig, writePermissionsConfig } from "@/lib/auth/permissions";
import { readUsers, writeUsers } from "@/lib/auth/users";

export interface PermissionActionState {
  error?: string;
  success?: string;
}

async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") return { error: "Unauthorized" };
  return null;
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function addPermissionAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const rawId = (formData.get("id") as string | null)?.trim() ?? "";
  const label = (formData.get("label") as string | null)?.trim() ?? "";

  if (!rawId && !label) return { error: "ID or label is required" };
  const id = rawId ? slugify(rawId) : slugify(label);
  if (!id) return { error: "Invalid ID" };
  const finalLabel = label || id;

  const config = readPermissionsConfig();
  if (config.permissions.some((p) => p.id === id)) return { error: `Permission "${id}" already exists` };

  writePermissionsConfig({ ...config, permissions: [...config.permissions, { id, label: finalLabel }] });
  revalidatePath("/admin/permissions");
  return { success: `Permission "${id}" added` };
}

export async function deletePermissionAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const id = formData.get("id") as string;
  const config = readPermissionsConfig();

  writePermissionsConfig({
    permissions: config.permissions.filter((p) => p.id !== id),
    roles: config.roles.map((r) => ({ ...r, permissions: r.permissions.filter((p) => p !== id) })),
  });

  // Remove from users too
  const users = readUsers();
  writeUsers(users.map((u) => ({
    ...u,
    permissions: (u.permissions ?? []).filter((p) => p !== id),
  })));

  revalidatePath("/admin/permissions");
  return { success: `Permission "${id}" deleted` };
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function addRoleAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const rawId = (formData.get("id") as string | null)?.trim() ?? "";
  const label = (formData.get("label") as string | null)?.trim() ?? "";

  if (!rawId && !label) return { error: "ID or label is required" };
  const id = rawId ? slugify(rawId) : slugify(label);
  if (!id) return { error: "Invalid ID" };
  const finalLabel = label || id;

  const config = readPermissionsConfig();
  if (config.roles.some((r) => r.id === id)) return { error: `Role "${id}" already exists` };

  writePermissionsConfig({ ...config, roles: [...config.roles, { id, label: finalLabel, permissions: [] }] });
  revalidatePath("/admin/permissions");
  return { success: `Role "${id}" added` };
}

export async function updateRolePermissionsAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const roleId = formData.get("roleId") as string;
  const permissions = formData.getAll("permissions") as string[];

  const config = readPermissionsConfig();
  const role = config.roles.find((r) => r.id === roleId);
  if (!role) return { error: "Role not found" };

  writePermissionsConfig({
    ...config,
    roles: config.roles.map((r) => r.id === roleId ? { ...r, permissions } : r),
  });
  revalidatePath("/admin/permissions");
  return { success: "Role updated" };
}

export async function deleteRoleAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const id = formData.get("id") as string;
  const config = readPermissionsConfig();

  writePermissionsConfig({ ...config, roles: config.roles.filter((r) => r.id !== id) });

  // Remove role from users
  const users = readUsers();
  writeUsers(users.map((u) => ({
    ...u,
    roles: (u.roles ?? []).filter((r) => r !== id),
  })));

  revalidatePath("/admin/permissions");
  return { success: `Role "${id}" deleted` };
}

// ── User role / permission assignment ─────────────────────────────────────────

export async function updateUserRolesAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const username = formData.get("username") as string;
  const roles = formData.getAll("roles") as string[];
  const permissions = formData.getAll("permissions") as string[];

  const users = readUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return { error: "User not found" };

  writeUsers(users.map((u) => u.username === username ? { ...u, roles, permissions } : u));
  revalidatePath("/admin/permissions");
  return { success: "User updated" };
}
