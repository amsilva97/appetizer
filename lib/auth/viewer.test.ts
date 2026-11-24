// @vitest-environment node
import { describe, expect, test } from "vitest";
import { resolveViewer, seesAllPages } from "@/lib/auth/viewer";
import type { AppUser } from "@/lib/auth/users";
import type { AppSettings } from "@/lib/auth/settings";
import { ADMIN_READ_PERMISSION, ALL_CAPABILITIES, type PermissionsConfig } from "@/types/permissions";

const config: PermissionsConfig = {
  permissions: [{ id: "media", label: "Media" }],
  roles: [{ id: "auditor", label: "Auditor", permissions: [ADMIN_READ_PERMISSION] }],
};

const allowlistOn: AppSettings = {
  forceLogin: false,
  adminIpAllowlist: { enabled: true, entries: ["10.0.0.0/8"] },
};

const user = (extra: Partial<AppUser>): AppUser => ({
  username: "u",
  passwordHash: "x",
  role: "user",
  isRoot: false,
  disabled: false,
  ...extra,
});

const view = (u: AppUser, clientIp: string) =>
  resolveViewer({ session: { loggedIn: true, username: u.username }, user: u, config, settings: allowlistOn, clientIp, env: {} as NodeJS.ProcessEnv });

describe("admin-read", () => {
  test("an admin on an allowed IP is a full admin", () => {
    const v = view(user({ role: "admin" }), "10.0.1.5");
    expect(v.isAdmin).toBe(true);
    expect(v.capabilities).toEqual(new Set(ALL_CAPABILITIES));
    expect(seesAllPages(v)).toBe(true);
  });

  test("an admin outside the allowlist falls back to admin-read: sees every page, can't edit", () => {
    const v = view(user({ role: "admin" }), "203.0.113.9");
    expect(v.isAdmin).toBe(false);
    expect(v.capabilities.size).toBe(0);
    expect(v.permissions.has(ADMIN_READ_PERMISSION)).toBe(true);
    expect(seesAllPages(v)).toBe(true);
  });

  test("a user granted admin-read directly sees every page without capabilities", () => {
    const v = view(user({ permissions: [ADMIN_READ_PERMISSION] }), "203.0.113.9");
    expect(v.capabilities.size).toBe(0);
    expect(seesAllPages(v)).toBe(true);
  });

  test("a user can get admin-read through a role", () => {
    expect(seesAllPages(view(user({ roles: ["auditor"] }), "203.0.113.9"))).toBe(true);
  });

  test("a plain user does not see every page", () => {
    expect(seesAllPages(view(user({ permissions: ["media"] }), "10.0.1.5"))).toBe(false);
  });

  test("a disabled admin gets nothing", () => {
    const v = view(user({ role: "admin", disabled: true }), "203.0.113.9");
    expect(v.loggedIn).toBe(false);
    expect(seesAllPages(v)).toBe(false);
  });
});
