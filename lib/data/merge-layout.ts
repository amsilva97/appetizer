import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import { referencesKeys } from "@/lib/auth/keys";
import { filterWidgets } from "@/lib/data/layouts";

export interface EditorScope {
  /** Can see every widget (pages:read or admin). */
  seeAll: boolean;
  /** The editor's view permissions, for working out what they couldn't see. */
  permissions: Set<string>;
  /** Can put {KEY} placeholders in feed headers (keys:read). */
  canUseKeys: boolean;
}

export type MergeResult =
  | { ok: true; widgets: WidgetInstance[]; mobileSlots: string[] | undefined }
  | { ok: false; error: string };

function feedOf(w: WidgetInstance | undefined): AppWidgetConfig["feed"] | undefined {
  return w?.type === "app" ? (w.config as AppWidgetConfig | undefined)?.feed : undefined;
}

function feedUsesKeys(feed: AppWidgetConfig["feed"]): boolean {
  return Array.isArray(feed?.headers) && feed.headers.some((h) => referencesKeys(h?.value));
}

/** Same target and headers, so the saved keys still go where an admin pointed them. */
function sameFeedTarget(a: AppWidgetConfig["feed"], b: AppWidgetConfig["feed"]): boolean {
  if (!a || !b) return false;
  return a.url === b.url && JSON.stringify(a.headers ?? []) === JSON.stringify(b.headers ?? []);
}

/** Put ids back at the positions they had before, around the editor's order. */
function reinsert(slots: string[], previous: string[], keep: Set<string>): string[] {
  const out = slots.filter((id) => !keep.has(id));
  previous.forEach((id, i) => {
    if (keep.has(id)) out.splice(Math.min(i, out.length), 0, id);
  });
  return out;
}

/**
 * Combine what a layout editor sent with what's saved.
 *
 * Editors who can't see every widget only ever received the ones they can see,
 * so their save would wipe the rest. Hidden widgets, and their phone slots,
 * are kept from the saved file and can't be overwritten by id.
 *
 * A feed that sends secret keys can only be pointed somewhere new by someone
 * with keys:read; otherwise an editor could send a key to their own server.
 */
export function mergeEditorChanges(
  saved: { widgets?: WidgetInstance[]; mobileSlots?: string[] },
  submitted: { widgets: WidgetInstance[]; mobileSlots?: string[] },
  scope: EditorScope
): MergeResult {
  const savedWidgets = saved.widgets ?? [];

  let hidden: WidgetInstance[] = [];
  if (!scope.seeAll) {
    const visible = new Set(filterWidgets(savedWidgets, scope.permissions, false).map((w) => w.id));
    hidden = savedWidgets.filter((w) => !visible.has(w.id));
  }
  const hiddenIds = new Set(hidden.map((w) => w.id));
  const fromEditor = submitted.widgets.filter((w) => !hiddenIds.has(w.id));

  if (!scope.canUseKeys) {
    const savedById = new Map(savedWidgets.map((w) => [w.id, w]));
    for (const w of fromEditor) {
      const feed = feedOf(w);
      if (feedUsesKeys(feed) && !sameFeedTarget(feed, feedOf(savedById.get(w.id)))) {
        return { ok: false, error: "Pointing a feed that uses secret keys somewhere new needs keys:read" };
      }
    }
  }

  const mobileSlots =
    submitted.mobileSlots === undefined
      ? undefined
      : hiddenIds.size === 0
        ? submitted.mobileSlots
        : reinsert(submitted.mobileSlots, saved.mobileSlots ?? [], hiddenIds);

  return { ok: true, widgets: [...fromEditor, ...hidden], mobileSlots };
}
