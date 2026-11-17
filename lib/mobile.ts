import type { AppWidgetConfig } from "@/types/app-widget";
import type { MobileConfig, MobileScreen } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";

export const DEFAULT_MOBILE: MobileConfig = { screens: [{ name: "main", label: "Main", slots: [] }] };

/** Fallback heights for cards whose desktop height is relative to a grid cell (e.g. "100%"). */
const PHONE_CARD_HEIGHT = 140;
const PHONE_FEED_HEIGHT = 360;

export type MobileItem =
  | { kind: "app"; widget: WidgetInstance }
  | { kind: "menu"; widget: WidgetInstance; children: WidgetInstance[] };

/** Widgets an admin can place on a phone screen: menus and app cards at any depth. Layouts are grid scaffolding only. */
export function trayWidgets(widgets: WidgetInstance[]): WidgetInstance[] {
  return widgets.filter((w) => w.type === "app" || w.type === "menu");
}

/** Slot ids → things to draw, in slot order. Menus carry their app children; unknown ids and layouts are skipped. */
export function resolveMobileSlots(slots: string[], widgets: WidgetInstance[]): MobileItem[] {
  const items: MobileItem[] = [];
  for (const id of slots) {
    const widget = widgets.find((w) => w.id === id);
    if (widget?.type === "app") items.push({ kind: "app", widget });
    if (widget?.type === "menu") {
      const children = widgets.filter((w) => w.type === "app" && w.parentId === widget.id);
      items.push({ kind: "menu", widget, children });
    }
  }
  return items;
}

/** Remove slot ids the viewer can't see, so guests don't learn the ids of hidden widgets. */
export function filterMobileConfig(mobile: MobileConfig, visibleIds: Set<string>): MobileConfig {
  return {
    screens: mobile.screens.map((s) => ({ ...s, slots: s.slots.filter((id) => visibleIds.has(id)) })),
  };
}

function isScreen(s: unknown): s is MobileScreen {
  if (!s || typeof s !== "object") return false;
  const { name, label, slots } = s as Record<string, unknown>;
  return (
    typeof name === "string" &&
    typeof label === "string" &&
    Array.isArray(slots) &&
    slots.every((id) => typeof id === "string")
  );
}

/** Validate a mobile config from a request body; undefined if it isn't one. */
export function parseMobileConfig(raw: unknown): MobileConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const screens = (raw as Record<string, unknown>).screens;
  if (!Array.isArray(screens) || !screens.every(isScreen)) return undefined;
  return { screens: screens.map(({ name, label, slots }) => ({ name, label, slots: [...slots] })) };
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
