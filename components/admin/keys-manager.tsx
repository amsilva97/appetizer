"use client";

import { useActionState } from "react";
import { addKeyAction, deleteKeyAction, type KeyActionState } from "@/app/admin/keys/actions";

const INITIAL: KeyActionState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-zinc-100 bg-zinc-800 border border-zinc-700 rounded-lg " +
  "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/[0.08] " +
  "focus:border-zinc-500 transition-colors";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

interface Props {
  keyNames: string[];
}

function DeleteKeyForm({ name }: { name: string }) {
  const [, action, pending] = useActionState(deleteKeyAction, INITIAL);
  return (
    <form action={action}>
      <input type="hidden" name="name" value={name} />
      <button
        type="submit"
        disabled={pending}
        title={`Delete ${name}`}
        className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
      >
        <TrashIcon />
      </button>
    </form>
  );
}

export default function KeysManager({ keyNames }: Props) {
  const [addState, addAction, addPending] = useActionState(addKeyAction, INITIAL);

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-300">Stored keys</h2>
        {keyNames.length === 0 ? (
          <p className="text-sm text-zinc-500">No keys yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
            {keyNames.map((name) => (
              <li key={name} className="flex items-center justify-between px-4 py-2.5 bg-zinc-900">
                <span className="text-sm font-mono text-zinc-200">{name}</span>
                <DeleteKeyForm name={name} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={addAction} className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-300">Add key</h2>

        {addState.error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {addState.error}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Name</p>
          <input name="name" type="text" placeholder="SONARR_KEY" className={INPUT} />
          <p className="text-[11px] text-zinc-600">Uppercase letters, digits, and underscores. Reference with {"{NAME}"} in headers.</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Value</p>
          <input name="value" type="password" placeholder="••••••••" className={INPUT} />
        </div>

        <button
          type="submit"
          disabled={addPending}
          className="self-start h-9 px-4 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {addPending ? "Adding…" : "Add key"}
        </button>
      </form>
    </div>
  );
}
