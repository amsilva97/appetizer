import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";

/**
 * Who you are and what you may do on this request. `role` is "admin" only
 * when admin rights actually apply (so not from outside the IP allowlist).
 * The UI uses this to decide what to show; the server checks again on every call.
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.loggedIn) {
    return NextResponse.json({ loggedIn: false, username: null, role: null, capabilities: [] });
  }
  return NextResponse.json({
    loggedIn: true,
    username: viewer.username,
    role: viewer.isAdmin ? "admin" : "user",
    capabilities: [...viewer.capabilities],
    ipRestricted: viewer.isAdminAccount && !viewer.ipAllowed,
  });
}
