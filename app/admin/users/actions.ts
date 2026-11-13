"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { addUser, deleteUser, findUser, readUsers, updateUser, type UserRole } from "@/lib/auth/users";
import { writeSettings } from "@/lib/auth/settings";
import { getSession } from "@/lib/auth/session";

export interface UserActionState {
  error?: string;
  success?: string;
}

async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return { error: "Unauthorized" };
  }
  return null;
}

export async function addUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const role = (formData.get("role") as string | null) ?? "user";

  if (!username) return { error: "Username is required" };
  if (username.length > 64) return { error: "Username max 64 characters" };
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return { error: "Username: letters, digits, _ and - only" };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters" };
  if (role !== "admin" && role !== "user") return { error: "Invalid role" };

  if (findUser(username)) return { error: "Username already taken" };

  const passwordHash = await bcrypt.hash(password, 12);
  addUser({ username, passwordHash, role: role as UserRole, isRoot: false, disabled: false });

  revalidatePath("/admin/users");
  return { success: `User "${username}" added` };
}

export async function deleteUserAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const username = formData.get("username") as string;
  const target = findUser(username);
  if (!target) return { error: "User not found" };
  if (target.isRoot) return { error: "Root admin cannot be deleted" };

  const session = await getSession();
  if (username === session.username) return { error: "Cannot delete your own account" };

  deleteUser(username);
  revalidatePath("/admin/users");
  return { success: `User "${username}" deleted` };
}

export async function toggleDisabledAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const username = formData.get("username") as string;
  const target = findUser(username);
  if (!target) return { error: "User not found" };

  const session = await getSession();
  if (username === session.username) return { error: "Cannot disable your own account" };

  updateUser(username, { disabled: !target.disabled });
  revalidatePath("/admin/users");
  return {};
}

export async function changeRoleAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const username = formData.get("username") as string;
  const role = formData.get("role") as UserRole;
  const target = findUser(username);
  if (!target) return { error: "User not found" };
  if (target.isRoot) return { error: "Root admin role cannot be changed" };
  if (role !== "admin" && role !== "user") return { error: "Invalid role" };

  const session = await getSession();
  if (username === session.username) return { error: "Cannot change your own role" };

  // Prevent demoting the last active admin
  if (role === "user") {
    const activeAdmins = readUsers().filter((u) => u.role === "admin" && !u.disabled);
    if (activeAdmins.length <= 1) return { error: "Cannot demote the last active admin" };
  }

  updateUser(username, { role });
  revalidatePath("/admin/users");
  return {};
}

export async function updateSettingsAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const forceLogin = formData.get("forceLogin") === "true";
  writeSettings({ forceLogin });
  revalidatePath("/admin/users");
  return { success: "Settings saved" };
}
