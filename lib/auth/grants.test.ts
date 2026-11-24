// @vitest-environment node
import { describe, expect, test } from "vitest";
import { checkAssignRoles, checkGrantPermissions } from "@/lib/auth/grants";
import { ANONYMOUS, type Viewer } from "@/lib/auth/viewer";
import { ADMIN_READ_PERMISSION, type Capability, type Role } from "@/types/permissions";

const viewerWith = (caps: Capability[], isAdmin = false): Viewer => ({
  ...ANONYMOUS,
  loggedIn: true,
  username: "boss",
  isAdmin,
  isAdminAccount: isAdmin,
  ipAllowed: true,
  capabilities: new Set(caps),
});

const roles: Role[] = [
  { id: "auditor", label: "Auditor", permissions: [ADMIN_READ_PERMISSION] },
  { id: "media", label: "Media", permissions: ["media"] },
];

describe("handing out admin-read", () => {
  test("a user manager without pages:read can't grant admin-read directly", () => {
    expect(checkGrantPermissions(viewerWith(["users:update"]), [], [ADMIN_READ_PERMISSION])).toMatch(/admin-read/);
  });

  test("a user manager with pages:read can grant it", () => {
    expect(checkGrantPermissions(viewerWith(["users:update", "pages:read"]), [], [ADMIN_READ_PERMISSION])).toBeNull();
  });

  test("keeping or removing admin-read is always allowed", () => {
    const v = viewerWith(["users:update"]);
    expect(checkGrantPermissions(v, [ADMIN_READ_PERMISSION], [ADMIN_READ_PERMISSION])).toBeNull();
    expect(checkGrantPermissions(v, [ADMIN_READ_PERMISSION], [])).toBeNull();
  });

  test("other view permissions are unaffected", () => {
    expect(checkGrantPermissions(viewerWith(["users:update"]), [], ["media"])).toBeNull();
  });

  test("a role carrying admin-read needs pages:read to assign", () => {
    expect(checkAssignRoles(viewerWith(["users:update"]), roles, [], ["auditor"])).toMatch(/admin-read/);
    expect(checkAssignRoles(viewerWith(["users:update", "pages:read"]), roles, [], ["auditor"])).toBeNull();
    expect(checkAssignRoles(viewerWith(["users:update"]), roles, [], ["media"])).toBeNull();
  });

  test("full admins pass", () => {
    expect(checkGrantPermissions(viewerWith([], true), [], [ADMIN_READ_PERMISSION])).toBeNull();
  });
});
