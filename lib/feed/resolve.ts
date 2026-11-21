import type { AppFeedConfig, AppWidgetConfig } from "@/types/app-widget";
import { userCanAccess } from "@/lib/auth/permissions";
import { DATA_DIR, filterWidgets, readIndex, readLayout } from "@/lib/data/layouts";

/**
 * Look up the feed saved on an app widget, as long as the viewer can see the
 * page and the widget. Returns null otherwise, so callers can't tell a hidden
 * widget from a missing one.
 */
export function findSavedFeed(
  page: string,
  widgetId: string,
  userPerms: Set<string>,
  isAdmin: boolean,
  dataDir: string = DATA_DIR
): AppFeedConfig | null {
  const index = readIndex(dataDir);
  const meta = index?.pages?.find((p) => p.name === page);
  if (!meta || !userCanAccess(meta.permissions, userPerms, isAdmin)) return null;

  const layout = readLayout(page, dataDir);
  if (!layout) return null;

  const widget = filterWidgets(layout.widgets ?? [], userPerms, isAdmin).find(
    (w) => w.id === widgetId && w.type === "app"
  );
  const feed = (widget?.config as AppWidgetConfig | undefined)?.feed;
  if (!feed || feed.method === "none" || !feed.url) return null;
  return feed;
}
