import { NextResponse } from "next/server";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";
import type { PageMeta } from "@/types/permissions";
import type { ToolbarStyle } from "@/types/toolbar";
import { DEFAULT_MOBILE, filterMobileConfig, parseMobileConfig } from "@/lib/mobile";
import { userCanAccess } from "@/lib/auth/permissions";
import { readSettings } from "@/lib/auth/settings";
import { can, getViewer, type Viewer } from "@/lib/auth/viewer";
import { mergeEditorChanges } from "@/lib/data/merge-layout";
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

/** pages:read (and admin) sees every page and widget regardless of view permissions. */
function seesAll(viewer: Viewer): boolean {
  return can(viewer, "pages:read");
}

export async function GET(request: Request) {
  ensureDir();

  const viewer = await getViewer();
  // The proxy doesn't cover /api, so Force Login has to be checked here too.
  if (!viewer.loggedIn && readSettings().forceLogin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const seeAll = seesAll(viewer);

  const index = readIndex();
  if (!index) return NextResponse.json({ pages: [], activePage: null, layout: null });

  const allPages = index.pages ?? [];

  const visiblePages = allPages.filter((page) =>
    userCanAccess(page.permissions, viewer.permissions, seeAll)
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
  const visibleWidgets = layout ? filterWidgets(layout.widgets ?? [], viewer.permissions, seeAll) : [];
  const filteredLayout = layout
    ? {
        ...layout,
        widgets: visibleWidgets,
        mobile: filterMobileConfig(
          parseMobileConfig(layout.mobile) ?? DEFAULT_MOBILE,
          new Set(visibleWidgets.map((w) => w.id))
        ),
      }
    : null;

  return NextResponse.json({
    pages: visiblePages.map(({ name, label }) => ({ name, label })),
    activePage: activePage.name,
    layout: filteredLayout,
    mobileEnabled: index.mobileEnabled ?? false,
  });
}

interface StateBody {
  background: BackgroundConfig;
  widgets: WidgetInstance[];
  toolbarStyle?: ToolbarStyle;
  mobile?: unknown;
  mobileEnabled?: unknown;
}

export async function POST(request: Request) {
  ensureDir();

  const viewer = await getViewer();
  if (!can(viewer, "pages:update")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: viewer.loggedIn ? 403 : 401 });
  }
  const seeAll = seesAll(viewer);

  let body: StateBody;
  try {
    body = (await request.json()) as StateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !Array.isArray(body.widgets)) {
    return NextResponse.json({ error: "widgets must be an array" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");

  let index = readIndex();
  if (!index) {
    const defaultPage: PageMeta = { name: "home", label: "Home", permissions: [] };
    index = { active: "home", pages: [defaultPage] };
    writeIndex(index);
  }

  const targetName = pageParam ?? index.active;
  const page = (index.pages ?? []).find((p) => p.name === targetName);
  // Editors can only save pages they can see; a hidden page looks the same as a missing one.
  if (!page || !userCanAccess(page.permissions, viewer.permissions, seeAll)) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const existing = readLayout(targetName);
  const merged = mergeEditorChanges(
    { widgets: existing?.widgets, mobileSlots: parseMobileConfig(existing?.mobile)?.slots },
    { widgets: body.widgets, mobileSlots: parseMobileConfig(body.mobile)?.slots },
    { seeAll, permissions: viewer.permissions, canUseKeys: can(viewer, "keys:read") }
  );
  if (!merged.ok) return NextResponse.json({ error: merged.error }, { status: 403 });

  const layout: LayoutConfig = {
    name: existing?.name ?? targetName,
    background: body.background,
    widgets: merged.widgets,
    toolbarStyle: body.toolbarStyle,
    mobile: merged.mobileSlots ? { slots: merged.mobileSlots } : parseMobileConfig(existing?.mobile),
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
