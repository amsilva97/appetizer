// @vitest-environment node
import { describe, expect, test } from "vitest";
import type { WidgetInstance } from "@/types/widget";
import type { MobileSlot } from "@/types/mobile";
import {
  DEFAULT_MOBILE,
  filterMobileConfig,
  insertSlot,
  moveSlot,
  removeSlot,
  updateSlot,
  parseMobileConfig,
  phoneAppConfig,
  phoneColumns,
  resolveMobileSlots,
  showsFeed,
  trayWidgets,
} from "./mobile";

const app = (id: string, parentId?: string): WidgetInstance => ({
  id, type: "app", x: 0, y: 0, parentId,
  config: { title: id, url: "https://a.test", height: 72, width: 240 } as never,
});
const menu = (id: string, parentId?: string): WidgetInstance => ({
  id, type: "menu", x: 0, y: 0, parentId, config: { label: `Menu ${id}` } as never,
});
const layout = (id: string): WidgetInstance => ({ id, type: "layout", x: 0, y: 0, config: { label: id } as never });

// Mirrors the live home page: a root layout holding menus of cards.
const WIDGETS = [layout("root"), menu("media", "root"), app("jellyfin", "media"), app("seerr", "media"), app("loose")];

const full = (...ids: string[]) => ids.map((id) => ({ id, span: "full" as const }));
const ids = (cards: { widget: WidgetInstance }[]) => cards.map((c) => c.widget.id);

describe("trayWidgets", () => {
  test("offers every app card on the page, including ones inside menus, and nothing else", () => {
    expect(trayWidgets(WIDGETS).map((w) => w.id)).toEqual(["jellyfin", "seerr", "loose"]);
  });
});

describe("resolveMobileSlots", () => {
  test("returns app cards in slot order", () => {
    expect(ids(resolveMobileSlots(full("loose", "jellyfin"), WIDGETS))).toEqual(["loose", "jellyfin"]);
  });

  test("never shows a card twice", () => {
    expect(ids(resolveMobileSlots(full("jellyfin", "seerr", "jellyfin"), WIDGETS))).toEqual(["jellyfin", "seerr"]);
  });

  test("skips missing ids, menus and layouts", () => {
    expect(ids(resolveMobileSlots(full("gone", "media", "root", "seerr"), WIDGETS))).toEqual(["seerr"]);
  });

  test("skips cards the viewer can't see, since they're absent from the filtered widgets", () => {
    const visible = WIDGETS.filter((w) => w.id !== "seerr");
    expect(ids(resolveMobileSlots(full("jellyfin", "seerr"), visible))).toEqual(["jellyfin"]);
  });
});

describe("filterMobileConfig", () => {
  test("drops ids for widgets the viewer can't see", () => {
    expect(filterMobileConfig({ slots: full("loose", "secret") }, new Set(["loose"])).slots).toEqual(full("loose"));
  });
});

describe("parseMobileConfig", () => {
  test("keeps slots with their width and phone logo view, and removes repeats", () => {
    const raw = { slots: [{ id: "a", span: "half", logoView: "compact" }, { id: "b", span: "third" }, { id: "a", span: "full" }] };
    expect(parseMobileConfig(raw)).toEqual({ slots: [{ id: "a", span: "half", logoView: "compact" }, { id: "b", span: "third" }] });
  });

  test("reads the older list of bare ids as full-width cards", () => {
    expect(parseMobileConfig({ slots: ["a", "b", "a"] })).toEqual({ slots: full("a", "b") });
  });

  test("falls back to full width and the card's own logo view for unknown values", () => {
    expect(parseMobileConfig({ slots: [{ id: "a", span: "quarter", logoView: "huge" }] })).toEqual({ slots: full("a") });
  });

  test("merges the old multi-screen shape into one list", () => {
    const old = { screens: [{ name: "main", label: "Apps", slots: ["a", "b"] }, { name: "s2", label: "2", slots: ["b", "c"] }] };
    expect(parseMobileConfig(old)).toEqual({ slots: full("a", "b", "c") });
  });

  test("rejects anything else", () => {
    expect(parseMobileConfig(undefined)).toBeUndefined();
    expect(parseMobileConfig({ slots: [1] })).toBeUndefined();
    expect(parseMobileConfig({ slots: [{ span: "half" }] })).toBeUndefined();
    expect(parseMobileConfig("x")).toBeUndefined();
  });
});

describe("phoneAppConfig", () => {
  test("replaces heights that only make sense inside a sized desktop cell", () => {
    const cfg = phoneAppConfig({ height: "100%", feed: { height: "calc(100% - 73px)" } } as never);
    expect(cfg.height).toBe(140);
    expect(cfg.feed?.height).toBe(360);
  });

  test("uses the phone's logo view when the slot sets one", () => {
    const cfg = { logoView: "icon", height: 72 } as never;
    expect(phoneAppConfig(cfg, { id: "a", span: "third", logoView: "compact" }).logoView).toBe("compact");
    expect(phoneAppConfig(cfg, { id: "a", span: "third" }).logoView).toBe("icon");
  });

  test("keeps pixel heights", () => {
    const cfg = phoneAppConfig({ height: 72, feed: { height: 200 } } as never);
    expect(cfg.height).toBe(72);
    expect(cfg.feed?.height).toBe(200);
  });
});

describe("showsFeed", () => {
  const feed = { method: "GET" };
  test("only icon and no-icon cards draw a feed", () => {
    expect(showsFeed({ logoView: "icon", feed } as never)).toBe(true);
    expect(showsFeed({ logoView: "none", feed } as never)).toBe(true);
    expect(showsFeed({ logoView: "compact", feed } as never)).toBe(false);
    expect(showsFeed({ logoView: "full", feed } as never)).toBe(false);
  });

  test("a card with no running feed draws none", () => {
    expect(showsFeed({ logoView: "icon" } as never)).toBe(false);
    expect(showsFeed({ logoView: "icon", feed: { method: "none" } } as never)).toBe(false);
  });
});

describe("phoneColumns", () => {
  test("full, half and third take 6, 3 and 2 of the 6 columns", () => {
    expect([phoneColumns("full", false), phoneColumns("half", false), phoneColumns("third", false)]).toEqual([6, 3, 2]);
  });

  test("a card showing its feed always takes the full row", () => {
    expect(phoneColumns("third", true)).toBe(6);
  });
});

test("DEFAULT_MOBILE is an empty list", () => {
  expect(DEFAULT_MOBILE).toEqual({ slots: [] });
});

describe("editing the slot list", () => {
  const order = (slots: { id: string }[]) => slots.map((s) => s.id);

  test("insertSlot adds a full-width card once", () => {
    const slots = full("a", "b");
    expect(insertSlot(slots, "c", 1)).toEqual([...full("a"), ...full("c"), ...full("b")]);
    expect(insertSlot(slots, "a", 0)).toBe(slots);
  });

  test("moveSlot moves a card before the one at the target", () => {
    const slots = full("a", "b", "c");
    expect(order(moveSlot(slots, 0, 2))).toEqual(["b", "a", "c"]);
    expect(order(moveSlot(slots, 2, 0))).toEqual(["c", "a", "b"]);
    expect(order(moveSlot(slots, 0, 3))).toEqual(["b", "c", "a"]);
    expect(moveSlot(slots, 1, 1)).toBe(slots);
  });

  test("updateSlot changes one card and can clear its phone logo view", () => {
    const slots: MobileSlot[] = [{ id: "a", span: "full", logoView: "compact" }, ...full("b")];
    expect(updateSlot(slots, "a", { span: "third" })[0]).toEqual({ id: "a", span: "third", logoView: "compact" });
    expect(updateSlot(slots, "a", { logoView: undefined })[0]).toEqual({ id: "a", span: "full" });
    expect(slots[0].logoView).toBe("compact");
  });

  test("removeSlot drops the card", () => {
    expect(order(removeSlot(full("a", "b"), "a"))).toEqual(["b"]);
  });
});
