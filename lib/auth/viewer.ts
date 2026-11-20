import { getSession } from "@/lib/auth/session";
import { findUser } from "@/lib/auth/users";
import { readPermissionsConfig, resolveUserPermissions } from "@/lib/auth/permissions";

export interface Viewer {
  loggedIn: boolean;
  isAdmin: boolean;
  permissions: Set<string>;
}

/** Who is making this request, and which permissions they hold. */
export async function getViewer(): Promise<Viewer> {
  const session = await getSession();
  const loggedIn = !!session.loggedIn;
  const isAdmin = loggedIn && session.role === "admin";
  let permissions = new Set<string>();

  if (loggedIn && !isAdmin) {
    const user = session.username ? findUser(session.username) : null;
    if (user) permissions = resolveUserPermissions(user, readPermissionsConfig());
  }

  return { loggedIn, isAdmin, permissions };
}
