"use client";

import { useActionState } from "react";
import { addKeyAction, deleteKeyAction, type KeyActionState } from "@/app/admin/keys/actions";
import { Button } from "@/components/ui/button";

const INITIAL: KeyActionState = {};

const INPUT =
  "w-full h-9 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "focus:border-brand/60 transition-colors";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function KeyEmptyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

function Panel({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface border border-line overflow-hidden">
      <div className="px-6 py-4 border-b border-line">
        <p className="text-base font-semibold text-fg">{heading}</p>
      </div>
      {children}
    </div>
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
        className="flex items-center justify-center size-8 rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10 disabled:opacity-40 transition-colors"
      >
        <TrashIcon />
      </button>
    </form>
  );
}

export default function KeysManager({ keyNames }: Props) {
  const [addState, addAction, addPending] = useActionState(addKeyAction, INITIAL);

  return (
    <>
      <div className="flex gap-3 items-start px-4 py-3.5 rounded-lg border border-line bg-surface-2 text-sm">
        <span className="text-fg-muted shrink-0 mt-0.5"><LockIcon /></span>
        <p className="text-fg-muted">
          Key values are <strong className="text-fg font-medium">write-only</strong> — they can never be read back once saved. Store your keys safely elsewhere before adding them here.
        </p>
      </div>

      <Panel heading="Stored keys">
        {keyNames.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="flex justify-center mb-3 text-fg-subtle">
              <KeyEmptyIcon />
            </div>
            <p className="text-sm font-medium text-fg-muted">No keys stored yet</p>
            <p className="text-xs text-fg-subtle mt-1">Add an API key to reference it in feed source headers.</p>
          </div>
        ) : (
          <ul>
            {keyNames.map((name) => (
              <li
                key={name}
                className="flex items-center justify-between px-6 py-3.5 border-b border-line last:border-0 hover:bg-white/[0.02]"
              >
                <div>
                  <span className="text-sm font-mono font-medium text-fg">{name}</span>
                  <p className="text-xs text-fg-subtle mt-0.5">••••••••</p>
                </div>
                <DeleteKeyForm name={name} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel heading="Add key">
        <form action={addAction} className="p-6 flex flex-col gap-4 max-w-sm">
          {addState.error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2.5">
              {addState.error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg">Name</label>
            <input name="name" type="text" placeholder="SONARR_KEY" className={INPUT} />
            <p className="text-xs text-fg-muted mt-1.5">
              Uppercase letters, digits, and underscores. Reference with{" "}
              <code className="font-mono text-fg">{"{KEY_NAME}"}</code> in feed headers.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg">Value</label>
            <input name="value" type="password" placeholder="••••••••" className={INPUT} />
          </div>

          <div className="pt-1">
            <Button type="submit" disabled={addPending}>
              {addPending ? "Adding…" : "Add key"}
            </Button>
          </div>
        </form>
      </Panel>
    </>
  );
}
