"use client";

import { useActionState } from "react";
import {
  updateAllowlistAction,
  updateForceLoginAction,
  type SettingsActionState,
} from "@/app/admin/settings/actions";
import type { AppSettings } from "@/lib/auth/settings";
import { Button } from "@/components/ui/button";
import { Badge, Notice, Panel } from "@/components/admin/admin-ui";

const INITIAL: SettingsActionState = {};

function Switch({ on }: { on: boolean }) {
  return (
    <span className={`relative inline-block shrink-0 w-11 h-6 rounded-full transition-colors ${on ? "bg-brand" : "bg-surface-2 ring-1 ring-line"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />
    </span>
  );
}

function ForceLoginPanel({ forceLogin, canUpdate }: { forceLogin: boolean; canUpdate: boolean }) {
  const [state, action, pending] = useActionState(updateForceLoginAction, INITIAL);
  return (
    <Panel heading="Sign-in">
      <form action={action} className="p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-fg">Force login</p>
            <p className="text-sm text-fg-muted mt-0.5">
              Visitors must sign in before they see anything, including the data API.
            </p>
          </div>
          <input type="hidden" name="forceLogin" value={forceLogin ? "false" : "true"} />
          <button
            type="submit"
            disabled={pending || !canUpdate}
            aria-pressed={forceLogin}
            aria-label={forceLogin ? "Turn force login off" : "Turn force login on"}
            className="disabled:opacity-50"
          >
            <Switch on={forceLogin} />
          </button>
        </div>
        <Notice error={state.error} success={state.success} />
      </form>
    </Panel>
  );
}

interface AllowlistProps {
  allowlist: AppSettings["adminIpAllowlist"];
  clientIp: string | null;
  clientAllowed: boolean;
  trustedProxies: string[];
  overriddenByEnv: boolean;
  canEdit: boolean;
}

function AllowlistPanel({ allowlist, clientIp, clientAllowed, trustedProxies, overriddenByEnv, canEdit }: AllowlistProps) {
  const [state, action, pending] = useActionState(updateAllowlistAction, INITIAL);

  return (
    <Panel
      heading="Local admin only"
      subheading="Admin rights only work from these addresses. Anywhere else, admins and anyone with admin capabilities are treated as regular users: they can still sign in and see their pages."
      actions={
        allowlist.enabled ? (
          overriddenByEnv ? <Badge label="Off (env override)" variant="amber" /> : <Badge label="On" variant="green" />
        ) : (
          <Badge label="Off" />
        )
      }
    >
      <form action={action} className="p-6 flex flex-col gap-5">
        {overriddenByEnv && (
          <Notice error="ADMIN_IP_ALLOWLIST=off is set on the server, so the allowlist isn't enforced right now." />
        )}

        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr] text-sm">
          <dt className="text-fg-muted">Your address</dt>
          <dd className="flex items-center gap-2">
            <code className="font-mono text-fg">{clientIp ?? "unknown"}</code>
            {allowlist.entries.length > 0 &&
              (clientAllowed ? <Badge label="in the list" variant="green" /> : <Badge label="not in the list" variant="amber" />)}
          </dd>
          <dt className="text-fg-muted">Trusted proxies</dt>
          <dd>
            {trustedProxies.length ? (
              <code className="font-mono text-fg">{trustedProxies.join(", ")}</code>
            ) : (
              <span className="text-fg-subtle">none (set TRUSTED_PROXIES if you run behind a reverse proxy)</span>
            )}
          </dd>
        </dl>

        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={allowlist.enabled}
            disabled={!canEdit}
            className="accent-brand size-4"
          />
          <span className="text-sm font-medium text-fg">Only allow admin rights from the addresses below</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Allowed addresses</span>
          <textarea
            name="entries"
            rows={5}
            defaultValue={allowlist.entries.join("\n")}
            disabled={!canEdit}
            placeholder={"192.0.2.0/24\n192.168.1.20\nfd00::/8"}
            className="w-full px-3 py-2.5 text-sm font-mono text-fg bg-surface-2 border border-line rounded-lg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/60 transition-colors disabled:opacity-60"
          />
          <span className="text-xs text-fg-subtle">
            One per line: a single IP or a CIDR range. You can&apos;t save a list that leaves out your own address.
            Locked out? Set <code className="font-mono">ADMIN_IP_ALLOWLIST=off</code> on the server and restart.
          </span>
        </label>

        <Notice error={state.error} success={state.success} />
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save allowlist"}</Button>
          </div>
        ) : (
          <p className="text-xs text-fg-subtle">Only admins can change the allowlist.</p>
        )}
      </form>
    </Panel>
  );
}

interface Props {
  settings: AppSettings;
  clientIp: string | null;
  clientAllowed: boolean;
  trustedProxies: string[];
  overriddenByEnv: boolean;
  canUpdate: boolean;
  canEditAllowlist: boolean;
}

export default function SettingsManager(props: Props) {
  return (
    <>
      <ForceLoginPanel forceLogin={props.settings.forceLogin} canUpdate={props.canUpdate} />
      <AllowlistPanel
        allowlist={props.settings.adminIpAllowlist}
        clientIp={props.clientIp}
        clientAllowed={props.clientAllowed}
        trustedProxies={props.trustedProxies}
        overriddenByEnv={props.overriddenByEnv}
        canEdit={props.canEditAllowlist}
      />
    </>
  );
}
