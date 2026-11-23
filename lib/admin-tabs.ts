import type { Capability } from "@/types/permissions";

export type AdminTab = "users" | "permissions" | "keys" | "settings";

export const ADMIN_TAB_INFO: Record<AdminTab, { href: string; label: string }> = {
  users: { href: "/admin/users", label: "Users" },
  permissions: { href: "/admin/permissions", label: "Roles & permissions" },
  keys: { href: "/admin/keys", label: "Keys" },
  settings: { href: "/admin/settings", label: "Settings" },
};

/** Which admin areas someone holding these capabilities can open. */
export function adminTabsFor(caps: ReadonlySet<Capability>): AdminTab[] {
  const tabs: AdminTab[] = [];
  if (caps.has("users:read")) tabs.push("users");
  if (caps.has("roles:read")) tabs.push("permissions");
  if (caps.has("keys:read")) tabs.push("keys");
  if (caps.has("settings:read")) tabs.push("settings");
  return tabs;
}
