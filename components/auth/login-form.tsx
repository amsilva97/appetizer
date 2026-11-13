"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const INITIAL: LoginState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg " +
  "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/25 " +
  "focus:border-brand/50 transition-colors";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col items-center gap-6 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dark-lockup.png" alt="Appetizer" className="h-16 w-auto" />
        <p className="text-sm text-zinc-400">Sign in to continue.</p>
      </div>

      {state.error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Username</p>
        <input name="username" type="text" placeholder="admin" autoComplete="username" className={INPUT} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Password</p>
        <input name="password" type="password" placeholder="Password" autoComplete="current-password" className={INPUT} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-9 px-4 rounded-lg bg-brand text-zinc-950 text-sm font-semibold hover:bg-brand/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
