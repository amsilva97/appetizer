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

describe("trayWidgets", () => {
  test("offers every app card on the page, including ones inside menus, and nothing else", () => {
    expect(trayWidgets(WIDGETS).map((w) => w.id)).toEqual(["jellyfin", "seerr", "loose"]);
  });
});

describe("resolveMobileSlots", () => {
  test("returns app cards in slot order", () => {
    expect(resolveMobileSlots(["loose", "jellyfin"], WIDGETS).map((w) => w.id)).toEqual(["loose", "jellyfin"]);
  });

  test("never shows a card twice", () => {
    expect(resolveMobileSlots(["jellyfin", "seerr", "jellyfin"], WIDGETS).map((w) => w.id)).toEqual(["jellyfin", "seerr"]);
  });

  test("skips missing ids, menus and layouts", () => {
    expect(resolveMobileSlots(["gone", "media", "root", "seerr"], WIDGETS).map((w) => w.id)).toEqual(["seerr"]);
  });

  test("skips cards the viewer can't see, since they're absent from the filtered widgets", () => {
    const visible = WIDGETS.filter((w) => w.id !== "seerr");
    expect(resolveMobileSlots(["jellyfin", "seerr"], visible).map((w) => w.id)).toEqual(["jellyfin"]);
  });
});

describe("filterMobileConfig", () => {
  test("drops ids for widgets the viewer can't see", () => {
    expect(filterMobileConfig({ slots: ["loose", "secret"] }, new Set(["loose"])).slots).toEqual(["loose"]);
  });
});

describe("parseMobileConfig", () => {
  test("keeps a slot list and removes repeats", () => {
    expect(parseMobileConfig({ slots: ["a", "b", "a"] })).toEqual({ slots: ["a", "b"] });
  });

  test("merges the old multi-screen shape into one list", () => {
    const old = { screens: [{ name: "main", label: "Apps", slots: ["a", "b"] }, { name: "s2", label: "2", slots: ["b", "c"] }] };
    expect(parseMobileConfig(old)).toEqual({ slots: ["a", "b", "c"] });
  });

  test("rejects anything else", () => {
    expect(parseMobileConfig(undefined)).toBeUndefined();
    expect(parseMobileConfig({ slots: [1] })).toBeUndefined();
    expect(parseMobileConfig("x")).toBeUndefined();
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

test("DEFAULT_MOBILE is an empty list", () => {
  expect(DEFAULT_MOBILE).toEqual({ slots: [] });
});
