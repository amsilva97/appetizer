import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";

export type UserRole = "admin" | "user";

export interface AppUser {
  username: string;
  passwordHash: string;
  role: UserRole;
  isRoot: boolean;
  disabled: boolean;
}

const DATA_DIR = join(process.cwd(), "data");
const USERS_PATH = join(DATA_DIR, "users.yaml");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function readUsers(): AppUser[] {
  if (!existsSync(USERS_PATH)) return [];
  const raw = yaml.load(readFileSync(USERS_PATH, "utf-8"));
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.users)) return obj.users as AppUser[];

  // Migrate legacy single-admin format: { username, passwordHash }
  if (typeof obj.username === "string" && typeof obj.passwordHash === "string") {
    return [{
      username: obj.username,
      passwordHash: obj.passwordHash,
      role: "admin",
      isRoot: true,
      disabled: false,
    }];
  }
  return [];
}

export function writeUsers(users: AppUser[]): void {
  ensureDataDir();
  const tmp = `${USERS_PATH}.tmp`;
  writeFileSync(tmp, yaml.dump({ users }, { indent: 2 }), "utf-8");
  renameSync(tmp, USERS_PATH);
}

export function adminExists(): boolean {
  return readUsers().some((u) => u.isRoot && u.role === "admin");
}

export function findUser(username: string): AppUser | null {
  return readUsers().find((u) => u.username === username) ?? null;
}

export function addUser(user: AppUser): void {
  writeUsers([...readUsers(), user]);
}

export function updateUser(
  username: string,
  patch: Partial<Omit<AppUser, "username" | "isRoot">>
): void {
  writeUsers(readUsers().map((u) => (u.username === username ? { ...u, ...patch } : u)));
}

export function deleteUser(username: string): void {
  writeUsers(readUsers().filter((u) => u.username !== username));
}
