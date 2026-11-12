"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { findUser } from "@/lib/auth/users";
import { getSession } from "@/lib/auth/session";

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const user = findUser(username);
  if (!user) return { error: "Invalid username or password" };
  if (user.disabled) return { error: "Account is disabled" };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { error: "Invalid username or password" };

  const session = await getSession();
  session.username = user.username;
  session.role = user.role;
  session.loggedIn = true;
  await session.save();

  redirect("/");
}
