import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import type { PageMeta } from "@/types/permissions";
import type { ToolbarStyle } from "@/types/toolbar";
import { userCanAccess } from "@/lib/auth/permissions";

export const DATA_DIR = join(process.cwd(), "data");

export interface IndexConfig {
  active: string;
  pages?: PageMeta[];
  import?: string[];
}

export interface LayoutConfig {
  name: string;
  background: BackgroundConfig;
  widgets: WidgetInstance[];
  toolbarStyle?: ToolbarStyle;
}

const PAGE_NAME_RE = /^[a-z0-9][a-z0-9_-]*$/i;

export function readIndex(dataDir: string = DATA_DIR): IndexConfig | null {
  const p = join(dataDir, "index.yaml");
  if (!existsSync(p)) return null;
  const raw = yaml.load(readFileSync(p, "utf-8")) as IndexConfig;
  if (!raw) return null;

  // Migrate legacy format: { active, import: [...] } → { active, pages: [...] }
  if (!raw.pages && Array.isArray(raw.import)) {
    raw.pages = raw.import.map((file) => {
      const name = file.replace(/\.yaml$/, "");
      return { name, label: name.charAt(0).toUpperCase() + name.slice(1), permissions: [] };
    });
  }

  if (!raw.pages) raw.pages = [{ name: raw.active ?? "home", label: "Home", permissions: [] }];
  return raw;
}

export function readLayout(name: string, dataDir: string = DATA_DIR): LayoutConfig | null {
  if (!PAGE_NAME_RE.test(name)) return null;
  const p = join(dataDir, `${name}.yaml`);
  if (!existsSync(p)) return null;
  return yaml.load(readFileSync(p, "utf-8")) as LayoutConfig;
}

/** Widgets the viewer may see: their own permissions pass and so do all their ancestors'. */
export function filterWidgets(
  widgets: WidgetInstance[],
  userPerms: Set<string>,
  isAdmin: boolean
): WidgetInstance[] {
  const allowedIds = new Set<string>();

  for (const w of widgets) {
    if (userCanAccess(w.permissions, userPerms, isAdmin)) {
      allowedIds.add(w.id);
    }
  }

  // Remove children whose parent was filtered out
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of Array.from(allowedIds)) {
      const w = widgets.find((w) => w.id === id)!;
      if (w.parentId && !allowedIds.has(w.parentId)) {
        allowedIds.delete(id);
        changed = true;
      }
    }
  }

  return widgets.filter((w) => allowedIds.has(w.id));
}
