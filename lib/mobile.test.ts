// @vitest-environment node
import { describe, expect, test } from "vitest";
import type { WidgetInstance } from "@/types/widget";
import {
  DEFAULT_MOBILE,
  filterMobileConfig,
  parseMobileConfig,
  phoneAppConfig,
  resolveMobileSlots,
  trayWidgets,
} from "./mobile";

const app = (id: string, parentId?: string, extra: object = {}): WidgetInstance => ({
  id, type: "app", x: 0, y: 0, parentId,
  config: { title: id, url: "https://a.test", height: 72, width: 240, ...extra } as never,
});
const menu = (id: string, parentId?: string): WidgetInstance => ({
  id, type: "menu", x: 0, y: 0, parentId, config: { label: `Menu ${id}` } as never,
});
const layout = (id: string): WidgetInstance => ({ id, type: "layout", x: 0, y: 0, config: { label: id } as never });

// Mirrors the live home page: a root layout holding menus of cards.
const WIDGETS = [layout("root"), menu("media", "root"), app("jellyfin", "media"), app("seerr", "media"), app("loose")];

describe("trayWidgets", () => {
  test("offers menus and app cards at any depth, but not layouts", () => {
    expect(trayWidgets(WIDGETS).map((w) => w.id)).toEqual(["media", "jellyfin", "seerr", "loose"]);
  });
});

describe("resolveMobileSlots", () => {
  test("turns slot ids into apps and menus with their app children, in slot order", () => {
    const items = resolveMobileSlots(["loose", "media"], WIDGETS);
    expect(items.map((i) => i.kind)).toEqual(["app", "menu"]);
    expect(items[1].kind === "menu" && items[1].children.map((c) => c.id)).toEqual(["jellyfin", "seerr"]);
  });

  test("skips ids that are missing or point at layouts", () => {
    expect(resolveMobileSlots(["gone", "root", "seerr"], WIDGETS).map((i) => i.widget.id)).toEqual(["seerr"]);
  });
});

describe("filterMobileConfig", () => {
  test("drops slots for widgets the viewer can't see", () => {
    const mobile = { screens: [{ name: "main", label: "Main", slots: ["loose", "secret"] }] };
    expect(filterMobileConfig(mobile, new Set(["loose"])).screens[0].slots).toEqual(["loose"]);
  });
});

describe("parseMobileConfig", () => {
  test("keeps well-formed screens", () => {
    const m = { screens: [{ name: "a", label: "A", slots: ["x"] }] };
    expect(parseMobileConfig(m)).toEqual(m);
  });

  test("rejects anything else", () => {
    expect(parseMobileConfig(undefined)).toBeUndefined();
    expect(parseMobileConfig({ screens: "x" })).toBeUndefined();
    expect(parseMobileConfig({ screens: [{ name: "a", label: "A", slots: [1] }] })).toBeUndefined();
  });
});

describe("phoneAppConfig", () => {
  test("replaces heights that only make sense inside a sized desktop cell", () => {
    const cfg = phoneAppConfig({ height: "100%", feed: { height: "calc(100% - 73px)" } } as never);
    expect(cfg.height).toBe(140);
    expect(cfg.feed?.height).toBe(360);
  });

  test("keeps pixel heights", () => {
    const cfg = phoneAppConfig({ height: 72, feed: { height: 200 } } as never);
    expect(cfg.height).toBe(72);
    expect(cfg.feed?.height).toBe(200);
  });
});

test("DEFAULT_MOBILE has one empty main screen", () => {
  expect(DEFAULT_MOBILE).toEqual({ screens: [{ name: "main", label: "Main", slots: [] }] });
});
