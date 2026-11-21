import type { AppWidgetConfig } from "@/types/app-widget";
import type { MobileConfig } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";

export const DEFAULT_MOBILE: MobileConfig = { slots: [] };

/** Fallback heights for cards whose desktop height is relative to a grid cell (e.g. "100%"). */
const PHONE_CARD_HEIGHT = 140;
const PHONE_FEED_HEIGHT = 360;

/** Cards an admin can place on the page's phone version: every app card on the page, at any depth. */
export function trayWidgets(widgets: WidgetInstance[]): WidgetInstance[] {
  return widgets.filter((w) => w.type === "app");
}

/**
 * The cards to draw, in order: each id at most once, and only app cards that exist in `widgets`.
 * Because `widgets` is already filtered for the viewer, hidden cards drop out here too.
 */
export function resolveMobileSlots(slots: string[], widgets: WidgetInstance[]): WidgetInstance[] {
  const seen = new Set<string>();
  const out: WidgetInstance[] = [];
  for (const id of slots) {
    if (seen.has(id)) continue;
    const w = widgets.find((x) => x.id === id && x.type === "app");
    if (!w) continue;
    seen.add(id);
    out.push(w);
  }
  return out;
}

/** Remove ids the viewer can't see, so guests don't learn the ids of hidden widgets. */
export function filterMobileConfig(mobile: MobileConfig, visibleIds: Set<string>): MobileConfig {
  return { slots: mobile.slots.filter((id) => visibleIds.has(id)) };
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/**
 * Validate a stored or posted phone config; undefined if it isn't one.
 * Also reads the older `{ screens: [{ slots }] }` shape by merging its screens into one list.
 */
export function parseMobileConfig(raw: unknown): MobileConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { slots, screens } = raw as Record<string, unknown>;
  if (isStringArray(slots)) return { slots: [...new Set(slots)] };
  if (Array.isArray(screens)) {
    const merged = screens.flatMap((s) => {
      const inner = s && typeof s === "object" ? (s as Record<string, unknown>).slots : undefined;
      return isStringArray(inner) ? inner : [];
    });
    return { slots: [...new Set(merged)] };
  }
  return undefined;
}

/** Card config for the phone stack: swap cell-relative heights for fixed ones so cards don't collapse. */
export function phoneAppConfig(cfg: AppWidgetConfig): AppWidgetConfig {
  const height = typeof cfg.height === "number" ? cfg.height : PHONE_CARD_HEIGHT;
  const feed = cfg.feed && {
    ...cfg.feed,
    height: typeof cfg.feed.height === "number" ? cfg.feed.height : PHONE_FEED_HEIGHT,
  };
  return { ...cfg, height, ...(feed ? { feed } : {}) };
}

/** Open an app's URL in a new tab without giving it a handle back to this page. */
export function openAppUrl(url: string | undefined): void {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
