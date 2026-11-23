import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import { parseIpEntry } from "@/lib/auth/ip";

const DATA_DIR = join(process.cwd(), "data");
const SETTINGS_PATH = join(DATA_DIR, "settings.yaml");

export interface AdminIpAllowlist {
  /** When on, admin rights only apply to requests from these addresses. */
  enabled: boolean;
  /** Single IPs or CIDR ranges, e.g. "192.0.2.0/24". */
  entries: string[];
}

export interface AppSettings {
  forceLogin: boolean;
  adminIpAllowlist: AdminIpAllowlist;
}

const DEFAULTS: AppSettings = {
  forceLogin: true,
  adminIpAllowlist: { enabled: false, entries: [] },
};

function parseAllowlist(raw: unknown): AdminIpAllowlist {
  if (!raw || typeof raw !== "object") return { ...DEFAULTS.adminIpAllowlist };
  const obj = raw as Record<string, unknown>;
  const entries = Array.isArray(obj.entries)
    ? obj.entries.filter((e): e is string => typeof e === "string" && parseIpEntry(e) !== null)
    : [];
  return { enabled: obj.enabled === true, entries };
}

export function readSettings(): AppSettings {
  if (!existsSync(SETTINGS_PATH)) return structuredClone(DEFAULTS);
  try {
    const raw = yaml.load(readFileSync(SETTINGS_PATH, "utf-8"));
    if (!raw || typeof raw !== "object") return structuredClone(DEFAULTS);
    const obj = raw as Record<string, unknown>;
    return {
      forceLogin: typeof obj.forceLogin === "boolean" ? obj.forceLogin : DEFAULTS.forceLogin,
      adminIpAllowlist: parseAllowlist(obj.adminIpAllowlist),
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function writeSettings(settings: AppSettings): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${SETTINGS_PATH}.tmp`;
  writeFileSync(tmp, yaml.dump(settings, { indent: 2 }), "utf-8");
  renameSync(tmp, SETTINGS_PATH);
}

/**
 * Setting ADMIN_IP_ALLOWLIST=off in the environment turns enforcement off,
 * so you can get back in if you lock yourself out.
 */
export function allowlistEnforced(
  settings: AppSettings,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if ((env.ADMIN_IP_ALLOWLIST ?? "").toLowerCase() === "off") return false;
  return settings.adminIpAllowlist.enabled;
}
