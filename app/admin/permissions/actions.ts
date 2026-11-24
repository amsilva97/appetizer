"use server";

import { revalidatePath } from "next/cache";
import { isBuiltinPermission, readPermissionsConfig, writePermissionsConfig } from "@/lib/auth/permissions";
import { readUsers, writeUsers } from "@/lib/auth/users";
import { actionGuard } from "@/lib/auth/action-guard";
import { checkDeleteRole, checkEditRoleCapabilities, checkGrantPermissions } from "@/lib/auth/grants";
import { isCapability, type Capability, type Role } from "@/types/permissions";

export interface PermissionActionState {
  error?: string;
  success?: string;
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function readIdAndLabel(formData: FormData): { id: string; label: string } | { error: string } {
  const rawId = (formData.get("id") as string | null)?.trim() ?? "";
  const label = (formData.get("label") as string | null)?.trim().slice(0, 64) ?? "";
  if (!rawId && !label) return { error: "ID or label is required" };
  const id = rawId ? slugify(rawId) : slugify(label);
  if (!id) return { error: "Invalid ID" };
  return { id, label: label || id };
}

function revalidate() {
  revalidatePath("/admin/permissions");
  revalidatePath("/admin/users");
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function addPermissionAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const { error } = await actionGuard("roles:write");
  if (error) return { error };

  const parsed = readIdAndLabel(formData);
  if ("error" in parsed) return parsed;
  const { id, label } = parsed;

  const config = readPermissionsConfig();
  if (config.permissions.some((p) => p.id === id)) return { error: `Permission "${id}" already exists` };

  writePermissionsConfig({ ...config, permissions: [...config.permissions, { id, label }] });
  revalidate();
  return { success: `Permission "${id}" added` };
}

export async function deletePermissionAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const { error } = await actionGuard("roles:delete");
  if (error) return { error };

  const id = formData.get("id") as string;
  const config = readPermissionsConfig();
  if (!config.permissions.some((p) => p.id === id)) return { error: "Permission not found" };
  if (isBuiltinPermission(id)) return { error: `"${id}" is built in and can't be deleted` };

  writePermissionsConfig({
    permissions: config.permissions.filter((p) => p.id !== id),
    roles: config.roles.map((r) => ({ ...r, permissions: r.permissions.filter((p) => p !== id) })),
  });

  writeUsers(readUsers().map((u) => ({
    ...u,
    permissions: (u.permissions ?? []).filter((p) => p !== id),
  })));

  revalidate();
  return { success: `Permission "${id}" deleted` };
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function addRoleAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const { error } = await actionGuard("roles:write");
  if (error) return { error };

  const parsed = readIdAndLabel(formData);
  if ("error" in parsed) return parsed;
  const { id, label } = parsed;

  const config = readPermissionsConfig();
  if (config.roles.some((r) => r.id === id)) return { error: `Role "${id}" already exists` };

  const role: Role = { id, label, permissions: [], capabilities: [] };
  writePermissionsConfig({ ...config, roles: [...config.roles, role] });
  revalidate();
  return { success: `Role "${id}" added` };
}

export async function deleteRoleAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const { viewer, error } = await actionGuard("roles:delete");
  if (!viewer) return { error };

  const id = formData.get("id") as string;
  const config = readPermissionsConfig();
  const role = config.roles.find((r) => r.id === id);
  if (!role) return { error: "Role not found" };
  const denied = checkDeleteRole(viewer, role);
  if (denied) return { error: denied };

  writePermissionsConfig({ ...config, roles: config.roles.filter((r) => r.id !== id) });
  writeUsers(readUsers().map((u) => ({
    ...u,
    roles: (u.roles ?? []).filter((r) => r !== id),
  })));

  revalidate();
  return { success: `Role "${id}" deleted` };
}

/**
 * Save the role matrix: every role's admin capabilities and view permissions
 * in one go. Each role is checked before anything is written.
 * Form fields: `roles` lists the role ids on screen; each ticked box sends
 * `grant` = "roleId|cap|users:read" or "roleId|perm|media".
 */
export async function saveRoleMatrixAction(
  _prev: PermissionActionState,
  formData: FormData
): Promise<PermissionActionState> {
  const { viewer, error } = await actionGuard("roles:update");
  if (!viewer) return { error };

  const config = readPermissionsConfig();
  const permIds = new Set(config.permissions.map((p) => p.id));

  const next = new Map<string, { capabilities: Capability[]; permissions: string[] }>();
  for (const id of formData.getAll("roles") as string[]) {
    if (config.roles.some((r) => r.id === id)) next.set(id, { capabilities: [], permissions: [] });
  }
  for (const entry of formData.getAll("grant") as string[]) {
    const [roleId, kind, value] = entry.split("|");
    const row = next.get(roleId);
    if (!row) continue;
    if (kind === "cap" && isCapability(value)) row.capabilities.push(value);
    if (kind === "perm" && permIds.has(value)) row.permissions.push(value);
  }

  let changed = 0;
  const roles: Role[] = [];
  for (const role of config.roles) {
    const row = next.get(role.id);
    if (!row) {
      roles.push(role);
      continue;
    }
    const denied =
      checkEditRoleCapabilities(viewer, role.capabilities ?? [], row.capabilities) ??
      checkGrantPermissions(viewer, role.permissions, row.permissions);
    if (denied) return { error: `${role.label}: ${denied}` };
    const same =
      JSON.stringify([...(role.capabilities ?? [])].sort()) === JSON.stringify([...row.capabilities].sort()) &&
      JSON.stringify([...role.permissions].sort()) === JSON.stringify([...row.permissions].sort());
    if (!same) changed++;
    roles.push({ ...role, capabilities: row.capabilities, permissions: row.permissions });
  }

  if (changed === 0) return { success: "No changes" };
  writePermissionsConfig({ ...config, roles });
  revalidate();
  return { success: `Saved ${changed} role${changed === 1 ? "" : "s"}` };
}
