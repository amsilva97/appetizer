import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const KEYS_PATH = join(DATA_DIR, ".key");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function readKeys(): Record<string, string> {
  if (!existsSync(KEYS_PATH)) return {};
  const lines = readFileSync(KEYS_PATH, "utf-8").split("\n");
  const result: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1);
    if (key) result[key] = value;
  }
  return result;
}

export function writeKeys(keys: Record<string, string>): void {
  ensureDataDir();
  const content = Object.entries(keys)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const tmp = `${KEYS_PATH}.tmp`;
  writeFileSync(tmp, content ? content + "\n" : "", "utf-8");
  renameSync(tmp, KEYS_PATH);
}

export function addKey(name: string, value: string): void {
  const keys = readKeys();
  writeKeys({ ...keys, [name]: value });
}

export function deleteKey(name: string): void {
  const keys = readKeys();
  const { [name]: _, ...rest } = keys;
  writeKeys(rest);
}

export function substituteKeys(template: string, keys: Record<string, string>): string {
  return template.replace(/\{([A-Z0-9_]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(keys, key) ? keys[key] : match
  );
}
