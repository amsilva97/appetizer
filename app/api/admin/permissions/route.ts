import { NextResponse } from "next/server";
import { guard } from "@/lib/auth/guard";
import { can } from "@/lib/auth/viewer";
import { readPermissionsConfig } from "@/lib/auth/permissions";

/**
 * Permission and role definitions. Layout editors get just the permission
 * list for the page and widget pickers; roles need roles:read.
 * Changes go through the server actions in app/admin/permissions.
 */
export async function GET() {
  const viewer = await guard("roles:read", "pages:update");
  if (viewer instanceof NextResponse) return viewer;
  const config = readPermissionsConfig();
  return NextResponse.json(
    can(viewer, "roles:read") ? config : { permissions: config.permissions, roles: [] }
  );
}
