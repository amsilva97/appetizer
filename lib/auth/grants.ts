import type { Viewer } from "@/lib/auth/viewer";
import type { AppUser } from "@/lib/auth/users";
import { ADMIN_READ_PERMISSION, type Capability, type Role } from "@/types/permissions";

/**
 * Rules that stop someone with partial admin rights from handing themselves
 * (or a friend) more than they already have. Full admins pass every check.
 * Each returns an error message, or null when allowed.
 */

function missing(viewer: Viewer, caps: Iterable<Capability>): Capability[] {
  return [...caps].filter((c) => !viewer.capabilities.has(c));
}

/** Only full admins can act on admin accounts (promote, demote, disable, delete, re-role). */
export function checkTargetUser(viewer: Viewer, target: AppUser): string | null {
  if (viewer.isAdmin) return null;
  if (target.role === "admin") return "Only admins can change admin accounts";
  if (target.username === viewer.username) return "You can't change your own access";
  return null;
}

/** Creating or promoting to admin is for admins only. */
export function checkGrantAdmin(viewer: Viewer): string | null {
  return viewer.isAdmin ? null : "Only admins can make other admins";
}

const ADMIN_READ_DENIED = `You need pages:read to grant ${ADMIN_READ_PERMISSION}`;

/** admin-read shows every page, so only someone who sees every page may hand it out. */
function grantsAdminRead(viewer: Viewer, added: string[]): boolean {
  return added.includes(ADMIN_READ_PERMISSION) && !viewer.capabilities.has("pages:read");
}

/** Giving someone roles: every capability in a newly added role must be one you hold. */
export function checkAssignRoles(
  viewer: Viewer,
  roles: Role[],
  before: string[],
  after: string[]
): string | null {
  if (viewer.isAdmin) return null;
  const added = after.filter((id) => !before.includes(id));
  for (const id of added) {
    const role = roles.find((r) => r.id === id);
    if (!role) return `Unknown role "${id}"`;
    const lacking = missing(viewer, role.capabilities ?? []);
    if (lacking.length) return `You can't grant "${role.label}": it includes ${lacking.join(", ")}`;
    if (grantsAdminRead(viewer, role.permissions)) return `"${role.label}": ${ADMIN_READ_DENIED}`;
  }
  return null;
}

/** Giving view permissions directly (to a user or a role). */
export function checkGrantPermissions(viewer: Viewer, before: string[], after: string[]): string | null {
  if (viewer.isAdmin) return null;
  const added = after.filter((id) => !before.includes(id));
  return grantsAdminRead(viewer, added) ? ADMIN_READ_DENIED : null;
}

/** Editing a role's capabilities: you can only add or remove ones you hold. */
export function checkEditRoleCapabilities(
  viewer: Viewer,
  before: Capability[],
  after: Capability[]
): string | null {
  if (viewer.isAdmin) return null;
  const changed = [
    ...after.filter((c) => !before.includes(c)),
    ...before.filter((c) => !after.includes(c)),
  ];
  const lacking = missing(viewer, changed);
  return lacking.length ? `You don't hold ${lacking.join(", ")}` : null;
}

/** Deleting a role: you must hold everything it grants. */
export function checkDeleteRole(viewer: Viewer, role: Role): string | null {
  if (viewer.isAdmin) return null;
  const lacking = missing(viewer, role.capabilities ?? []);
  return lacking.length ? `"${role.label}" grants ${lacking.join(", ")}, which you don't hold` : null;
}
