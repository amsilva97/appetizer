import type { AppUser, PublicUser } from "@/lib/auth/users";
import type { PageMeta } from "@/types/permissions";
import { ALL_CAPABILITIES, type Capability, type PermissionsConfig } from "@/types/permissions";

export interface EffectiveAccess {
  username: string;
  isAdmin: boolean;
  disabled: boolean;
  /** capability -> where it comes from ("admin" or role labels) */
  capabilities: Partial<Record<Capability, string>>;
  /** view permission id -> where it comes from ("direct" and/or role labels) */
  permissions: Record<string, string>;
}

function add(map: Record<string, string>, key: string, source: string) {
  map[key] = map[key] ? `${map[key]}, ${source}` : source;
}

/**
 * What each user ends up with from their account type, roles and direct
 * grants. Ignores the IP allowlist, which depends on where a request comes from.
 */
export function effectiveAccess(users: (AppUser | PublicUser)[], config: PermissionsConfig): EffectiveAccess[] {
  return users.map((u) => {
    const capabilities: Record<string, string> = {};
    const permissions: Record<string, string> = {};
    const isAdmin = u.role === "admin";

    if (isAdmin) {
      ALL_CAPABILITIES.forEach((c) => (capabilities[c] = "admin"));
    } else {
      for (const id of u.permissions ?? []) add(permissions, id, "direct");
      for (const roleId of u.roles ?? []) {
        const role = config.roles.find((r) => r.id === roleId);
        if (!role) continue;
        role.capabilities?.forEach((c) => add(capabilities, c, role.label));
        role.permissions.forEach((p) => add(permissions, p, role.label));
      }
    }

    return { username: u.username, isAdmin, disabled: u.disabled, capabilities, permissions };
  });
}

/** How many roles, users (directly) and pages use each permission. */
export function permissionUsage(
  users: (AppUser | PublicUser)[],
  config: PermissionsConfig,
  pages: PageMeta[]
): Record<string, { roles: number; users: number; pages: number }> {
  return Object.fromEntries(
    config.permissions.map((p) => [
      p.id,
      {
        roles: config.roles.filter((r) => r.permissions.includes(p.id)).length,
        users: users.filter((u) => (u.permissions ?? []).includes(p.id)).length,
        pages: pages.filter((pg) => (pg.permissions ?? []).includes(p.id)).length,
      },
    ])
  );
}
