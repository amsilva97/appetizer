import { NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import type { PageMeta } from "@/types/permissions";
import type { ToolbarStyle } from "@/types/toolbar";
import { getSession } from "@/lib/auth/session";
import { filterMobileConfig, parseMobileConfig } from "@/lib/mobile";
import { findUser } from "@/lib/auth/users";
import { readPermissionsConfig, resolveUserPermissions, userCanAccess } from "@/lib/auth/permissions";
import {
  DATA_DIR,
  filterWidgets,
  readIndex,
  readLayout,
  type IndexConfig,
  type LayoutConfig,
} from "@/lib/data/layouts";

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function writeIndex(index: IndexConfig): void {
  writeFileSync(join(DATA_DIR, "index.yaml"), yaml.dump(index, { indent: 2 }));
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
      mobileEnabled: index.mobileEnabled ?? false,
    });
  }

  const layout = readLayout(activePage.name);
  const visibleWidgets = layout ? filterWidgets(layout.widgets ?? [], userPerms, isAdmin) : [];
  const filteredLayout = layout
    ? {
        ...layout,
        widgets: visibleWidgets,
        mobile: layout.mobile
          ? filterMobileConfig(layout.mobile, new Set(visibleWidgets.map((w) => w.id)))
          : undefined,
      }
    : null;

  return NextResponse.json({
    pages: visiblePages.map(({ name, label }) => ({ name, label })),
    activePage: activePage.name,
    layout: filteredLayout,
    mobileEnabled: index.mobileEnabled ?? false,
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
    toolbarStyle?: ToolbarStyle;
    mobile?: unknown;
    mobileEnabled?: unknown;
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
    toolbarStyle: body.toolbarStyle,
    mobile: parseMobileConfig(body.mobile) ?? existing?.mobile,
  };

  writeFileSync(
    join(DATA_DIR, `${targetName}.yaml`),
    yaml.dump(layout, { indent: 2, lineWidth: -1 })
  );

  // The phone switch is site-wide; only touch index.yaml when it actually changes.
  if (typeof body.mobileEnabled === "boolean" && body.mobileEnabled !== (index.mobileEnabled ?? false)) {
    writeIndex({ ...index, mobileEnabled: body.mobileEnabled });
  }

  return NextResponse.json({ ok: true });
}
