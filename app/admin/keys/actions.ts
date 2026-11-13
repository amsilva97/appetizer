"use server";

import { revalidatePath } from "next/cache";
import { addKey, deleteKey } from "@/lib/auth/keys";

export interface KeyActionState {
  error?: string;
}

const KEY_NAME_RE = /^[A-Z0-9_]+$/;

export async function addKeyAction(
  _prev: KeyActionState,
  formData: FormData
): Promise<KeyActionState> {
  const name = (formData.get("name") as string | null)?.trim().toUpperCase() ?? "";
  const value = (formData.get("value") as string | null) ?? "";

  if (!name) return { error: "Key name is required" };
  if (!KEY_NAME_RE.test(name)) return { error: "Name must be uppercase letters, digits, and underscores only" };
  if (name.length > 64) return { error: "Name too long (max 64 characters)" };
  if (!value) return { error: "Value is required" };

  addKey(name, value);
  revalidatePath("/admin/keys");
  return {};
}

export async function deleteKeyAction(
  _prev: KeyActionState,
  formData: FormData
): Promise<KeyActionState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) return { error: "Key name is required" };
  deleteKey(name);
  revalidatePath("/admin/keys");
  return {};
}
