import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";

const DATA_DIR = join(process.cwd(), "data");
const SETTINGS_PATH = join(DATA_DIR, "settings.yaml");

export interface AppSettings {
  forceLogin: boolean;
}

const DEFAULTS: AppSettings = { forceLogin: true };

export function readSettings(): AppSettings {
  if (!existsSync(SETTINGS_PATH)) return { ...DEFAULTS };
  try {
    const raw = yaml.load(readFileSync(SETTINGS_PATH, "utf-8"));
    if (!raw || typeof raw !== "object") return { ...DEFAULTS };
    const obj = raw as Record<string, unknown>;
    return {
      forceLogin: typeof obj.forceLogin === "boolean" ? obj.forceLogin : DEFAULTS.forceLogin,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSettings(settings: AppSettings): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${SETTINGS_PATH}.tmp`;
  writeFileSync(tmp, yaml.dump(settings, { indent: 2 }), "utf-8");
  renameSync(tmp, SETTINGS_PATH);
}
