"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const INITIAL: LoginState = {};

const INPUT =
  "w-full h-10 px-3.5 text-sm text-zinc-100 bg-zinc-800/60 border border-zinc-700/80 rounded-xl " +
  "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand/30 " +
  "focus:border-brand/60 transition-all";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);

  return (
    <div className="relative w-full max-w-sm z-10">
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-0.5 bg-gradient-to-r from-brand to-brand-alt" />

        <div className="px-8 pt-8 pb-9">
          <div className="flex flex-col items-center gap-5 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dark-lockup.png" alt="Appetizer" className="h-10 w-auto" />
            <p className="text-sm text-zinc-400">Welcome back — sign in to continue.</p>
          </div>

          <form action={action} className="flex flex-col gap-5">
            {state.error && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-red-500/10 border border-red-500/25 rounded-xl">
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-red-400 shrink-0 mt-px"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <p className="text-xs text-red-400 leading-snug">{state.error}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Username
              </label>
              <input
                name="username"
                type="text"
                placeholder="admin"
                autoComplete="username"
                className={INPUT}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className={INPUT}
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-1 h-10 px-4 rounded-xl bg-gradient-to-r from-brand to-brand-alt text-zinc-950 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-brand/20"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
