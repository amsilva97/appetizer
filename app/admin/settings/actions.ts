"use server";

import { revalidatePath } from "next/cache";
import { readSettings, writeSettings } from "@/lib/auth/settings";
import { actionGuard } from "@/lib/auth/action-guard";
import { checkGrantAdmin } from "@/lib/auth/grants";
import { ipMatches, parseIpEntry } from "@/lib/auth/ip";

export interface SettingsActionState {
  error?: string;
  success?: string;
}

export async function updateForceLoginAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const { error } = await actionGuard("settings:update");
  if (error) return { error };

  const forceLogin = formData.get("forceLogin") === "true";
  writeSettings({ ...readSettings(), forceLogin });
  revalidatePath("/admin/settings");
  return { success: forceLogin ? "Force login is on" : "Force login is off" };
}

/** Split a textarea of addresses on new lines, commas and spaces. */
function parseEntries(raw: string): { entries: string[]; invalid: string[] } {
  const parts = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  const entries: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    if (!parseIpEntry(p)) invalid.push(p);
    else if (!entries.includes(p)) entries.push(p);
  }
  return { entries, invalid };
}

/**
 * Turning the allowlist on or editing it decides who can be an admin at all,
 * so it's for full admins only. Refuses any change that would cut off the
 * request making it.
 */
export async function updateAllowlistAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const { viewer, error } = await actionGuard("settings:update");
  if (!viewer) return { error };
  const notAdmin = checkGrantAdmin(viewer);
  if (notAdmin) return { error: "Only admins can change the admin IP allowlist" };

  const enabled = formData.get("enabled") === "on";
  const { entries, invalid } = parseEntries((formData.get("entries") as string | null) ?? "");
  if (invalid.length) return { error: `Not an IP or CIDR range: ${invalid.join(", ")}` };
  if (entries.length > 100) return { error: "At most 100 entries" };

  if (enabled) {
    if (entries.length === 0) return { error: "Add at least one address before turning the allowlist on" };
    if (!ipMatches(viewer.clientIp, entries)) {
      return {
        error: `That would lock you out: your address (${viewer.clientIp ?? "unknown"}) isn't in the list`,
      };
    }
  }

  writeSettings({ ...readSettings(), adminIpAllowlist: { enabled, entries } });
  revalidatePath("/admin/settings");
  return { success: enabled ? `Allowlist on with ${entries.length} entr${entries.length === 1 ? "y" : "ies"}` : "Allowlist saved (off)" };
}
