"use client";

import { useActionState } from "react";
import { addKeyAction, deleteKeyAction, type KeyActionState } from "@/app/admin/keys/actions";
import { Button } from "@/components/ui/button";
import {
  EmptyRow,
  ICON_BTN_DANGER,
  INPUT,
  Notice,
  Panel,
  ROW,
  TD,
  TH,
  Table,
  TrashIcon,
} from "@/components/admin/admin-ui";

const INITIAL: KeyActionState = {};

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function KeyRow({ name, canDelete }: { name: string; canDelete: boolean }) {
  const [state, action, pending] = useActionState(deleteKeyAction, INITIAL);
  return (
    <tr className={ROW}>
      <td className={`${TD} font-mono font-medium text-fg`}>
        {name}
        {state.error && <p className="text-xs text-danger font-sans font-normal mt-0.5">{state.error}</p>}
      </td>
      <td className={`${TD} font-mono text-fg-subtle`}>••••••••</td>
      <td className={`${TD} font-mono text-xs text-fg-muted`}>{`{${name}}`}</td>
      <td className={`${TD} text-right w-12`}>
        {canDelete && (
          <form
            action={action}
            onSubmit={(e) => {
              if (!confirm(`Delete ${name}? Feeds using it will stop authenticating.`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="name" value={name} />
            <button type="submit" disabled={pending} className={ICON_BTN_DANGER} aria-label={`Delete ${name}`}>
              <TrashIcon />
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}

interface Props {
  keyNames: string[];
  canWrite: boolean;
  canDelete: boolean;
}

export default function KeysManager({ keyNames, canWrite, canDelete }: Props) {
  const [addState, addAction, addPending] = useActionState(addKeyAction, INITIAL);

  return (
    <>
      <div className="flex gap-3 items-start px-4 py-3.5 rounded-lg border border-line bg-surface-2 text-sm">
        <span className="text-fg-muted shrink-0 mt-0.5"><LockIcon /></span>
        <p className="text-fg-muted">
          Key values are <strong className="text-fg font-medium">write-only</strong>: they can never be read back once
          saved. Adding a key with an existing name replaces its value.
        </p>
      </div>

      <Panel heading="Stored keys" subheading={`${keyNames.length} key${keyNames.length === 1 ? "" : "s"}`}>
        <Table>
          <thead>
            <tr>
              <th className={TH}>Name</th>
              <th className={TH}>Value</th>
              <th className={TH}>Use in headers as</th>
              <th className={TH}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {keyNames.length === 0 ? (
              <EmptyRow colSpan={4}>No keys stored yet.</EmptyRow>
            ) : (
              keyNames.map((name) => <KeyRow key={name} name={name} canDelete={canDelete} />)
            )}
          </tbody>
        </Table>
      </Panel>

      {canWrite && (
        <Panel heading="Add or replace a key">
          <form action={addAction} className="p-6 flex flex-col gap-4">
            <Notice error={addState.error} />
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-fg">Name</span>
                <input name="name" type="text" placeholder="SONARR_KEY" autoComplete="off" className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-fg">Value</span>
                <input name="value" type="password" placeholder="••••••••" autoComplete="new-password" className={INPUT} />
              </label>
              <Button type="submit" disabled={addPending}>
                {addPending ? "Saving…" : "Save key"}
              </Button>
            </div>
            <p className="text-xs text-fg-muted">Uppercase letters, digits and underscores.</p>
          </form>
        </Panel>
      )}
    </>
  );
}
