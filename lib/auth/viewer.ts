import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { findUser, type AppUser } from "@/lib/auth/users";
import {
  readPermissionsConfig,
  resolveUserCapabilities,
  resolveUserPermissions,
} from "@/lib/auth/permissions";
import { allowlistEnforced, readSettings, type AppSettings } from "@/lib/auth/settings";
import { clientIpFromHeaders, ipMatches } from "@/lib/auth/ip";
import { ALL_CAPABILITIES, type Capability, type PermissionsConfig } from "@/types/permissions";

export interface Viewer {
  loggedIn: boolean;
  username: string | null;
  /** Full admin for this request: an admin account on an allowed IP. */
  isAdmin: boolean;
  /** The account is an admin, whatever the IP. */
  isAdminAccount: boolean;
  /** False when the admin IP allowlist is on and this request comes from outside it. */
  ipAllowed: boolean;
  clientIp: string | null;
  /** View permissions: which pages and widgets they can see. */
  permissions: Set<string>;
  /** Admin capabilities that apply to this request. */
  capabilities: Set<Capability>;
}

export const ANONYMOUS: Viewer = {
  loggedIn: false,
  username: null,
  isAdmin: false,
  isAdminAccount: false,
  ipAllowed: false,
  clientIp: null,
  permissions: new Set(),
  capabilities: new Set(),
};

export interface ViewerInput {
  session: { loggedIn?: boolean; username?: string };
  /** The account as stored now, not as remembered by the cookie. */
  user: AppUser | null;
  config: PermissionsConfig;
  settings: AppSettings;
  clientIp: string | null;
  env?: NodeJS.ProcessEnv;
}

/**
 * Work out what this request may do. The cookie only says who someone is;
 * their role, roles and disabled flag are always read from users.yaml so
 * changes apply on the next request. Admin rights from any source are
 * dropped when the IP allowlist is on and the request comes from elsewhere.
 */
export function resolveViewer({ session, user, config, settings, clientIp, env }: ViewerInput): Viewer {
  if (!session.loggedIn || !user || user.disabled) return { ...ANONYMOUS, clientIp };

  const ipAllowed = allowlistEnforced(settings, env)
    ? ipMatches(clientIp, settings.adminIpAllowlist.entries)
    : true;

  const isAdminAccount = user.role === "admin";
  const isAdmin = isAdminAccount && ipAllowed;

  let capabilities = new Set<Capability>();
  if (ipAllowed) capabilities = isAdmin ? new Set(ALL_CAPABILITIES) : resolveUserCapabilities(user, config);

  return {
    loggedIn: true,
    username: user.username,
    isAdmin,
    isAdminAccount,
    ipAllowed,
    clientIp,
    permissions: isAdmin ? new Set() : resolveUserPermissions(user, config),
    capabilities,
  };
}

/** Who is making this request, and what they may do. */
export async function getViewer(): Promise<Viewer> {
  const session = await getSession();
  const clientIp = clientIpFromHeaders(await headers());
  const user = session.loggedIn && session.username ? findUser(session.username) : null;
  return resolveViewer({
    session,
    user,
    config: readPermissionsConfig(),
    settings: readSettings(),
    clientIp,
  });
}

export function can(viewer: Viewer, capability: Capability): boolean {
  return viewer.capabilities.has(capability);
}

/** Has at least one admin capability, so the admin area is worth showing. */
export function hasAnyCapability(viewer: Viewer): boolean {
  return viewer.capabilities.size > 0;
}

/** The viewer when they hold the capability, otherwise null. */
export async function requireCapability(capability: Capability): Promise<Viewer | null> {
  const viewer = await getViewer();
  return can(viewer, capability) ? viewer : null;
}
