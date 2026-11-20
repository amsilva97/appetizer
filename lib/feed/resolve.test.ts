// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import * as yaml from "js-yaml";
import { findSavedFeed } from "./resolve";

const FEED = {
  method: "GET",
  url: "https://example.test/api",
  headers: [],
  transform: "",
  pollInterval: 30,
  height: 200,
};

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "appetizer-feed-"));
  writeFileSync(
    join(dir, "index.yaml"),
    yaml.dump({
      active: "home",
      pages: [
        { name: "home", label: "Home", permissions: [] },
        { name: "infra", label: "Infra", permissions: ["infra"] },
      ],
    })
  );
  writeFileSync(
    join(dir, "home.yaml"),
    yaml.dump({
      name: "home",
      widgets: [
        { id: "public", type: "app", x: 0, y: 0, config: { feed: FEED } },
        { id: "locked", type: "app", x: 0, y: 0, permissions: ["secret"], config: { feed: FEED } },
        { id: "menu", type: "menu", x: 0, y: 0, permissions: ["secret"], config: {} },
        { id: "child", type: "app", x: 0, y: 0, parentId: "menu", config: { feed: FEED } },
        { id: "nofeed", type: "app", x: 0, y: 0, config: { feed: { ...FEED, method: "none" } } },
      ],
    })
  );
  writeFileSync(
    join(dir, "infra.yaml"),
    yaml.dump({ name: "infra", widgets: [{ id: "w", type: "app", x: 0, y: 0, config: { feed: FEED } }] })
  );
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("findSavedFeed", () => {
  test("returns the saved feed for a widget the viewer can see", () => {
    expect(findSavedFeed("home", "public", new Set(), false, dir)?.url).toBe(FEED.url);
  });

  test("returns null when the widget needs a permission the viewer lacks", () => {
    expect(findSavedFeed("home", "locked", new Set(), false, dir)).toBeNull();
  });

  test("returns null when a parent widget is hidden from the viewer", () => {
    expect(findSavedFeed("home", "child", new Set(), false, dir)).toBeNull();
    expect(findSavedFeed("home", "child", new Set(["secret"]), false, dir)?.url).toBe(FEED.url);
  });

  test("returns null when the page is hidden from the viewer", () => {
    expect(findSavedFeed("infra", "w", new Set(), false, dir)).toBeNull();
    expect(findSavedFeed("infra", "w", new Set(["infra"]), false, dir)?.url).toBe(FEED.url);
  });

  test("returns null for unknown pages, unknown widgets and disabled feeds", () => {
    expect(findSavedFeed("missing", "public", new Set(), false, dir)).toBeNull();
    expect(findSavedFeed("home", "missing", new Set(), false, dir)).toBeNull();
    expect(findSavedFeed("home", "nofeed", new Set(), false, dir)).toBeNull();
  });

  test("rejects page names that try to leave the data directory", () => {
    expect(findSavedFeed("../home", "public", new Set(), true, dir)).toBeNull();
  });

  test("admins see every widget", () => {
    expect(findSavedFeed("home", "locked", new Set(), true, dir)?.url).toBe(FEED.url);
  });
});
