import { NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import type { PageMeta } from "@/types/permissions";
import { getSession } from "@/lib/auth/session";
import { findUser } from "@/lib/auth/users";
import { readPermissionsConfig, resolveUserPermissions, userCanAccess } from "@/lib/auth/permissions";

const DATA_DIR = join(process.cwd(), "data");

interface IndexConfig {
  active: string;
  pages?: PageMeta[];
  import?: string[];
}

interface LayoutConfig {
  name: string;
  background: BackgroundConfig;
  widgets: WidgetInstance[];
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readIndex(): IndexConfig | null {
  const p = join(DATA_DIR, "index.yaml");
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

function writeIndex(index: IndexConfig): void {
  writeFileSync(join(DATA_DIR, "index.yaml"), yaml.dump(index, { indent: 2 }));
}

function readLayout(name: string): LayoutConfig | null {
  const p = join(DATA_DIR, `${name}.yaml`);
  if (!existsSync(p)) return null;
  return yaml.load(readFileSync(p, "utf-8")) as LayoutConfig;
}

function filterWidgets(
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

export async function GET(request: Request) {
  ensureDir();

  const session = await getSession();
  const isAdmin = !!(session.loggedIn && session.role === "admin");
  let userPerms = new Set<string>();
  if (session.loggedIn && !isAdmin) {
    const user = session.username ? findUser(session.username) : null;
    if (user) {
      const permConfig = readPermissionsConfig();
      userPerms = resolveUserPermissions(user, permConfig);
    }
  }

  const index = readIndex();
  if (!index) return NextResponse.json({ pages: [], activePage: null, layout: null });

  const allPages = index.pages ?? [];

  const visiblePages = allPages.filter((page) =>
    userCanAccess(page.permissions, userPerms, isAdmin)
  );

  const { searchParams } = new URL(request.url);
  const requestedPage = searchParams.get("page");
  const activeName = requestedPage ?? index.active;

  const activePage = visiblePages.find((p) => p.name === activeName) ?? visiblePages[0] ?? null;

  if (!activePage) {
    return NextResponse.json({
      pages: visiblePages.map(({ name, label }) => ({ name, label })),
      activePage: null,
      layout: null,
    });
  }

  const layout = readLayout(activePage.name);
  const filteredLayout = layout
    ? {
        ...layout,
        widgets: filterWidgets(layout.widgets ?? [], userPerms, isAdmin),
      }
    : null;

  return NextResponse.json({
    pages: visiblePages.map(({ name, label }) => ({ name, label })),
    activePage: activePage.name,
    layout: filteredLayout,
  });
}

export async function POST(request: Request) {
  ensureDir();

  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    background: BackgroundConfig;
    widgets: WidgetInstance[];
  };

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");

  let index = readIndex();
  if (!index) {
    const defaultPage: PageMeta = { name: "home", label: "Home", permissions: [] };
    index = { active: "home", pages: [defaultPage] };
    writeIndex(index);
  }

  const targetName = pageParam ?? index.active;
  const pageExists = (index.pages ?? []).some((p) => p.name === targetName);
  if (!pageExists) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const existing = readLayout(targetName);
  const layout: LayoutConfig = {
    name: existing?.name ?? targetName,
    background: body.background,
    widgets: body.widgets,
  };

  writeFileSync(
    join(DATA_DIR, `${targetName}.yaml`),
    yaml.dump(layout, { indent: 2, lineWidth: -1 })
  );

  return NextResponse.json({ ok: true });
}
