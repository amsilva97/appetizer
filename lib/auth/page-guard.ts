import { redirect } from "next/navigation";
import { can, getViewer, type Viewer } from "@/lib/auth/viewer";
import type { Capability } from "@/types/permissions";

/** For admin pages: the viewer, or a redirect home when they lack the capability. */
export async function requirePageCapability(capability: Capability): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer.loggedIn) redirect("/login");
  if (!can(viewer, capability)) redirect("/");
  return viewer;
}
