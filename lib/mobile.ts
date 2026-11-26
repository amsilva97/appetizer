import { LOGO_VIEWS, type AppWidgetConfig, type LogoView } from "@/types/app-widget";
import type { MobileConfig, MobileSlot, MobileSpan } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";

export const DEFAULT_MOBILE: MobileConfig = { slots: [] };

export const MOBILE_SPANS: readonly MobileSpan[] = ["full", "half", "third"];

/** The phone grid has six columns, so full, half and third all divide it evenly. */
export const PHONE_GRID_COLUMNS = 6;
const SPAN_COLUMNS: Record<MobileSpan, number> = { full: 6, half: 3, third: 2 };

/** Fallback heights for cards whose desktop height is relative to a grid cell (e.g. "100%"). */
const PHONE_CARD_HEIGHT = 140;
const PHONE_FEED_HEIGHT = 360;

/** A card to draw on the phone, with the slot that placed it. */
export interface PhoneCard {
  widget: WidgetInstance;
  slot: MobileSlot;
}

/** Cards an admin can place on the page's phone version: every app card on the page, at any depth. */
export function trayWidgets(widgets: WidgetInstance[]): WidgetInstance[] {
  return widgets.filter((w) => w.type === "app");
}

/**
 * The cards to draw, in order: each id at most once, and only app cards that exist in `widgets`.
 * Because `widgets` is already filtered for the viewer, hidden cards drop out here too.
 */
export function resolveMobileSlots(slots: MobileSlot[], widgets: WidgetInstance[]): PhoneCard[] {
  const seen = new Set<string>();
  const out: PhoneCard[] = [];
  for (const slot of slots) {
    if (seen.has(slot.id)) continue;
    const widget = widgets.find((x) => x.id === slot.id && x.type === "app");
    if (!widget) continue;
    seen.add(slot.id);
    out.push({ widget, slot });
  }
  return out;
}

/** Remove slots the viewer can't see, so guests don't learn the ids of hidden widgets. */
export function filterMobileConfig(mobile: MobileConfig, visibleIds: Set<string>): MobileConfig {
  return { slots: mobile.slots.filter((s) => visibleIds.has(s.id)) };
}

const isSpan = (v: unknown): v is MobileSpan => MOBILE_SPANS.includes(v as MobileSpan);
const isLogoView = (v: unknown): v is LogoView => LOGO_VIEWS.includes(v as LogoView);

/** One stored slot: a bare id (older files) or `{ id, span, logoView }`. Undefined if it's neither. */
function parseSlot(raw: unknown): MobileSlot | undefined {
  if (typeof raw === "string") return { id: raw, span: "full" };
  if (!raw || typeof raw !== "object") return undefined;
  const { id, span, logoView } = raw as Record<string, unknown>;
  if (typeof id !== "string") return undefined;
  return { id, span: isSpan(span) ? span : "full", ...(isLogoView(logoView) ? { logoView } : {}) };
}

/** Parse every entry, or undefined if any entry isn't a slot. Later repeats of an id are dropped. */
function parseSlots(raw: unknown[]): MobileSlot[] | undefined {
  const seen = new Set<string>();
  const out: MobileSlot[] = [];
  for (const item of raw) {
    const slot = parseSlot(item);
    if (!slot) return undefined;
    if (seen.has(slot.id)) continue;
    seen.add(slot.id);
    out.push(slot);
  }
  return out;
}

/**
 * Validate a stored or posted phone config; undefined if it isn't one.
 * Also reads older shapes: a list of bare ids, and `{ screens: [{ slots }] }` merged into one list.
 */
export function parseMobileConfig(raw: unknown): MobileConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { slots, screens } = raw as Record<string, unknown>;
  if (Array.isArray(slots)) {
    const parsed = parseSlots(slots);
    return parsed ? { slots: parsed } : undefined;
  }
  if (Array.isArray(screens)) {
    const merged = screens.flatMap((s) => {
      const inner = s && typeof s === "object" ? (s as Record<string, unknown>).slots : undefined;
      return Array.isArray(inner) ? inner : [];
    });
    const parsed = parseSlots(merged);
    return parsed ? { slots: parsed } : undefined;
  }
  return undefined;
}

/** Whether a card draws its feed. Full cover and compact cards have no room for one. */
export function showsFeed(cfg: AppWidgetConfig): boolean {
  return cfg.feed?.method === "GET" && (cfg.logoView === "icon" || cfg.logoView === "none");
}

/**
 * Card config for the phone: the phone's logo view if the slot sets one, and fixed
 * heights in place of cell-relative ones so cards don't collapse.
 */
export function phoneAppConfig(cfg: AppWidgetConfig, slot?: MobileSlot): AppWidgetConfig {
  const height = typeof cfg.height === "number" ? cfg.height : PHONE_CARD_HEIGHT;
  const feed = cfg.feed && {
    ...cfg.feed,
    height: typeof cfg.feed.height === "number" ? cfg.feed.height : PHONE_FEED_HEIGHT,
  };
  const logoView = slot?.logoView ?? cfg.logoView;
  return { ...cfg, height, logoView, ...(feed ? { feed } : {}) };
}

/** Grid columns a card takes. A card that draws its feed always takes the full row so the feed stays readable. */
export function phoneColumns(span: MobileSpan, showingFeed: boolean): number {
  return showingFeed ? PHONE_GRID_COLUMNS : SPAN_COLUMNS[span];
}

/** Open an app's URL in a new tab without giving it a handle back to this page. */
export function openAppUrl(url: string | undefined): void {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

// ─── Editing the slot list (each returns a new list) ─────────────────────────

/** Add a full-width card at `at`, unless it's already on the phone. */
export function insertSlot(slots: MobileSlot[], id: string, at: number): MobileSlot[] {
  if (slots.some((s) => s.id === id)) return slots;
  return [...slots.slice(0, at), { id, span: "full" }, ...slots.slice(at)];
}

/** Move the slot at `from` so it sits before the slot that is at `to` now (`to` = length puts it last). */
export function moveSlot(slots: MobileSlot[], from: number, to: number): MobileSlot[] {
  if (from === to || from < 0 || from >= slots.length) return slots;
  const rest = slots.filter((_, i) => i !== from);
  const at = to > from ? to - 1 : to;
  return [...rest.slice(0, at), slots[from], ...rest.slice(at)];
}

/** Change one card's phone settings. `logoView: undefined` goes back to the card's own logo view. */
export function updateSlot(slots: MobileSlot[], id: string, patch: Partial<Omit<MobileSlot, "id">>): MobileSlot[] {
  return slots.map((s) => {
    if (s.id !== id) return s;
    const next = { ...s, ...patch };
    if (next.logoView === undefined) delete next.logoView;
    return next;
  });
}

export function removeSlot(slots: MobileSlot[], id: string): MobileSlot[] {
  return slots.filter((s) => s.id !== id);
}
