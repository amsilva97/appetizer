"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

const INITIAL: LoginState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "focus:border-brand/60 transition-colors";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL);

  return (
    <div className="w-full max-w-sm">
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-0.5 bg-gradient-to-r from-brand to-brand-alt" />

        <div className="px-8 pt-8 pb-9">
          <div className="flex flex-col items-center gap-5 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dark-lockup.png" alt="Appetizer" className="h-10 w-auto" />
            <p className="text-sm text-fg-muted">Welcome back — sign in to continue.</p>
          </div>

          <form action={action} className="flex flex-col gap-5">
            {state.error && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-danger/10 border border-danger/25 rounded-lg">
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-danger shrink-0 mt-px"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <p className="text-xs text-danger leading-snug">{state.error}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-fg">
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
              <label className="text-sm font-medium text-fg">
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

            <Button type="submit" disabled={pending} className="mt-1 w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
