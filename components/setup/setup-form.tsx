"use client";

import { useActionState } from "react";
import { createAdmin, type SetupState } from "@/app/setup/actions";
import { Button } from "@/components/ui/button";

const INITIAL: SetupState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "focus:border-brand/60 transition-colors";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-danger mt-1">{msg}</p>;
}

export default function SetupForm() {
  const [state, action, pending] = useActionState(createAdmin, INITIAL);

  return (
    <div className="relative w-full max-w-sm z-10">
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-0.5 bg-gradient-to-r from-brand to-brand-alt" />

        <div className="px-8 pt-8 pb-9">
          <div className="flex flex-col items-center gap-5 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dark-lockup.png" alt="Appetizer" className="h-10 w-auto" />
            <p className="text-sm text-fg-muted">Set up your homepage for the first time.</p>
          </div>

          <form action={action} className="flex flex-col gap-5">
            {state.errors?.general && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-danger/10 border border-danger/25 rounded-xl">
                <p className="text-xs text-danger leading-snug">{state.errors.general}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                Username
              </label>
              <input name="username" type="text" placeholder="admin" autoComplete="username" className={INPUT} />
              <FieldError msg={state.errors?.username} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                Password
              </label>
              <input name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" className={INPUT} />
              <FieldError msg={state.errors?.password} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                Confirm password
              </label>
              <input name="confirm" type="password" placeholder="Re-enter password" autoComplete="new-password" className={INPUT} />
              <FieldError msg={state.errors?.confirm} />
            </div>

            <Button type="submit" disabled={pending} className="mt-1 w-full">
              {pending ? "Creating…" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
