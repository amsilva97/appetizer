import { NextResponse } from "next/server";
import { can, getViewer, type Viewer } from "@/lib/auth/viewer";
import type { Capability } from "@/types/permissions";

/**
 * For route handlers: the viewer if they hold any of the capabilities,
 * otherwise a 401 (not logged in) or 403 (logged in, not allowed) response.
 */
export async function guard(...anyOf: Capability[]): Promise<Viewer | NextResponse> {
  const viewer = await getViewer();
  if (anyOf.some((c) => can(viewer, c))) return viewer;
  return NextResponse.json(
    { error: viewer.loggedIn ? "Forbidden" : "Unauthorized" },
    { status: viewer.loggedIn ? 403 : 401 }
  );
}
