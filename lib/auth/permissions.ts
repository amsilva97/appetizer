import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import { isCapability, type Capability, type PermissionsConfig, type Role } from "@/types/permissions";
import type { AppUser } from "@/lib/auth/users";

const DATA_DIR = join(process.cwd(), "data");
const PERMISSIONS_PATH = join(DATA_DIR, "permissions.yaml");

const EMPTY: PermissionsConfig = { permissions: [], roles: [] };

function parseRole(raw: unknown): Role | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  return {
    id: r.id,
    label: typeof r.label === "string" ? r.label : r.id,
    permissions: Array.isArray(r.permissions) ? r.permissions.filter((p): p is string => typeof p === "string") : [],
    capabilities: Array.isArray(r.capabilities) ? r.capabilities.filter(isCapability) : [],
  };
}

export function readPermissionsConfig(): PermissionsConfig {
  if (!existsSync(PERMISSIONS_PATH)) return { permissions: [], roles: [] };
  try {
    const raw = yaml.load(readFileSync(PERMISSIONS_PATH, "utf-8"));
    if (!raw || typeof raw !== "object") return { ...EMPTY };
    const obj = raw as Record<string, unknown>;
    return {
      permissions: Array.isArray(obj.permissions) ? (obj.permissions as PermissionsConfig["permissions"]) : [],
      roles: Array.isArray(obj.roles) ? obj.roles.map(parseRole).filter((r): r is Role => r !== null) : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writePermissionsConfig(config: PermissionsConfig): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${PERMISSIONS_PATH}.tmp`;
  writeFileSync(tmp, yaml.dump(config, { indent: 2 }), "utf-8");
  renameSync(tmp, PERMISSIONS_PATH);
}

/** View permissions a user holds directly or through their roles. */
export function resolveUserPermissions(user: AppUser, config: PermissionsConfig): Set<string> {
  const perms = new Set<string>(user.permissions ?? []);
  for (const roleId of user.roles ?? []) {
    const role = config.roles.find((r) => r.id === roleId);
    if (role) role.permissions.forEach((p) => perms.add(p));
  }
  return perms;
}

/** Admin capabilities a user gets through their roles. */
export function resolveUserCapabilities(user: AppUser, config: PermissionsConfig): Set<Capability> {
  const caps = new Set<Capability>();
  for (const roleId of user.roles ?? []) {
    const role = config.roles.find((r) => r.id === roleId);
    role?.capabilities?.forEach((c) => caps.add(c));
  }
  return caps;
}

/** A user must hold every permission a page or widget requires. */
export function userCanAccess(
  requiredPermissions: string[] | undefined,
  userPermissions: Set<string>,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.every((p) => userPermissions.has(p));
}
