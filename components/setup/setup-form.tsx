"use client";

import { useActionState } from "react";
import { createAdmin, type SetupState } from "@/app/setup/actions";

const INITIAL: SetupState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg " +
  "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/[0.08] " +
  "focus:border-zinc-500 transition-colors";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-400">{msg}</p>;
}

export default function SetupForm() {
  const [state, action, pending] = useActionState(createAdmin, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col items-center gap-6 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dark-lockup.png" alt="Appetizer" className="h-16 w-auto" />
        <p className="text-sm text-zinc-400">Set up your homepage for the first time.</p>
      </div>

      {state.errors?.general && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {state.errors.general}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Username</p>
        <input name="username" type="text" placeholder="admin" className={INPUT} />
        <FieldError msg={state.errors?.username} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Password</p>
        <input name="password" type="password" placeholder="At least 8 characters" className={INPUT} />
        <FieldError msg={state.errors?.password} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Confirm password</p>
        <input name="confirm" type="password" placeholder="Re-enter password" className={INPUT} />
        <FieldError msg={state.errors?.confirm} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-9 px-4 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
