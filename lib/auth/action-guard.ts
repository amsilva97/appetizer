import { can, getViewer, type Viewer } from "@/lib/auth/viewer";
import type { Capability } from "@/types/permissions";

export type ActionGuard = { viewer: Viewer; error?: undefined } | { viewer?: undefined; error: string };

/**
 * For server actions. They are reachable from any page with a crafted POST,
 * whatever the proxy does for the page itself, so every action checks here.
 */
export async function actionGuard(capability: Capability): Promise<ActionGuard> {
  const viewer = await getViewer();
  if (!viewer.loggedIn) return { error: "Not signed in" };
  if (!can(viewer, capability)) {
    return {
      error: viewer.isAdminAccount && !viewer.ipAllowed
        ? "Admin rights aren't available from this network"
        : `You need ${capability} to do that`,
    };
  }
  return { viewer };
}
