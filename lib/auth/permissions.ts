import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { PermissionsConfig } from "@/types/permissions";
import type { AppUser } from "@/lib/auth/users";

const DATA_DIR = join(process.cwd(), "data");
const PERMISSIONS_PATH = join(DATA_DIR, "permissions.yaml");

const EMPTY: PermissionsConfig = { permissions: [], roles: [] };

export function readPermissionsConfig(): PermissionsConfig {
  if (!existsSync(PERMISSIONS_PATH)) return { permissions: [], roles: [] };
  try {
    const raw = yaml.load(readFileSync(PERMISSIONS_PATH, "utf-8"));
    if (!raw || typeof raw !== "object") return { ...EMPTY };
    const obj = raw as Record<string, unknown>;
    return {
      permissions: Array.isArray(obj.permissions) ? (obj.permissions as PermissionsConfig["permissions"]) : [],
      roles: Array.isArray(obj.roles) ? (obj.roles as PermissionsConfig["roles"]) : [],
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

export function resolveUserPermissions(user: AppUser, config: PermissionsConfig): Set<string> {
  const perms = new Set<string>(user.permissions ?? []);
  for (const roleId of user.roles ?? []) {
    const role = config.roles.find((r) => r.id === roleId);
    if (role) role.permissions.forEach((p) => perms.add(p));
  }
  return perms;
}

export function userCanAccess(
  requiredPermissions: string[] | undefined,
  userPermissions: Set<string>,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  return requiredPermissions.some((p) => userPermissions.has(p));
}
