"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { adminExists, addUser } from "@/lib/auth/users";

export interface SetupState {
  errors?: {
    username?: string;
    password?: string;
    confirm?: string;
    general?: string;
  };
}

export async function createAdmin(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  const errors: SetupState["errors"] = {};

  if (!username) errors.username = "Required";
  else if (username.length > 64) errors.username = "Max 64 characters";

  if (!password) errors.password = "Required";
  else if (password.length < 8) errors.password = "At least 8 characters";

  if (!confirm) errors.confirm = "Required";
  else if (password && confirm !== password) errors.confirm = "Passwords do not match";

  if (Object.keys(errors).length > 0) return { errors };

  if (adminExists()) return { errors: { general: "Admin already configured" } };

  const passwordHash = await bcrypt.hash(password, 12);
  addUser({ username, passwordHash, role: "admin", isRoot: true, disabled: false });

  redirect("/login");
}
