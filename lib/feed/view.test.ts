import { describe, expect, test } from "vitest";
import {
  buttonId,
  countMatches,
  focusFilter,
  getPath,
  parseCss,
  pickPaths,
  resolveStyle,
  toggleFilter,
  toText,
  usedPaths,
  visibleRows,
} from "./view";
import { DEFAULT_FEED_CONFIG, type FeedFilterButton } from "@/types/feed";

describe("getPath", () => {
  const row = { a: { b: [{ c: 5 }] }, n: 0 };
  test("reads dotted paths, including array indexes", () => {
    expect(getPath(row, "a.b.0.c")).toBe(5);
    expect(getPath(row, "n")).toBe(0);
  });
  test("an empty path is the row itself", () => {
    expect(getPath(row, "")).toBe(row);
  });
  test("missing parts give undefined instead of throwing", () => {
    expect(getPath(row, "a.x.y")).toBeUndefined();
    expect(getPath(null, "a")).toBeUndefined();
  });
});

describe("toText", () => {
  test("shows values as plain strings", () => {
    expect(toText(null)).toBe("");
    expect(toText(3)).toBe("3");
    expect(toText("<b>x</b>")).toBe("<b>x</b>");
    expect(toText({ a: 1 })).toBe('{"a":1}');
  });
});

describe("parseCss", () => {
  test("turns CSS text into a React style object", () => {
    expect(parseCss("color: red; font-size:10px;  background-color : #fff")).toEqual({
      color: "red",
      fontSize: "10px",
      backgroundColor: "#fff",
    });
  });
  test("keeps custom properties and values containing colons", () => {
    expect(parseCss("--x: 1; background: url(https://a.test/b.png)")).toEqual({
      "--x": "1",
      background: "url(https://a.test/b.png)",
    });
  });
  test("ignores junk", () => {
    expect(parseCss("nonsense; :x; y:")).toEqual({});
    expect(parseCss(undefined)).toEqual({});
  });
});

describe("resolveStyle", () => {
  const rule = {
    base: "color: grey; padding: 1px",
    switchKey: "s",
    cases: [
      { equals: "pending", style: "color: orange" },
      { equals: "1", style: "color: blue" },
    ],
  };
  test("adds the matching case on top of the base", () => {
    expect(resolveStyle(rule, { s: "pending" })).toEqual({ color: "orange", padding: "1px" });
  });
  test("matches numbers by their text", () => {
    expect(resolveStyle(rule, { s: 1 })).toEqual({ color: "blue", padding: "1px" });
  });
  test("no match keeps the base", () => {
    expect(resolveStyle(rule, { s: "other" })).toEqual({ color: "grey", padding: "1px" });
    expect(resolveStyle(undefined, {})).toEqual({});
  });
});

describe("filter buttons", () => {
  const buttons: FeedFilterButton[] = [
    { label: "pending", key: "s", equals: "pending" },
    { label: "approved", key: "s", equals: "approved" },
  ];
  const rows = [{ s: "pending" }, { s: "approved" }, { s: "pending" }, { s: "other" }];
  const [pending, approved] = buttons.map(buttonId);

  test("counts matching rows", () => {
    expect(countMatches(rows, buttons[0])).toBe(2);
  });

  test("toggle adds and removes without changing the original", () => {
    const start = new Set([pending]);
    expect([...toggleFilter(start, approved)].sort()).toEqual([approved, pending].sort());
    expect([...toggleFilter(start, pending)]).toEqual([]);
    expect([...start]).toEqual([pending]);
  });

  test("focus selects only that button, or clears when it already was the only one", () => {
    expect([...focusFilter(new Set([pending, approved]), approved)]).toEqual([approved]);
    expect([...focusFilter(new Set([approved]), approved)]).toEqual([]);
  });

  test("nothing selected shows every row", () => {
    expect(visibleRows(rows, buttons, new Set())).toEqual(rows);
  });

  test("selected buttons show rows matching any of them", () => {
    expect(visibleRows(rows, buttons, new Set([pending]))).toEqual([rows[0], rows[2]]);
    expect(visibleRows(rows, buttons, new Set([pending, approved]))).toHaveLength(3);
  });

  test("a selected button that no longer exists is ignored", () => {
    expect(visibleRows(rows, buttons, new Set(["gone"]))).toEqual(rows);
  });
});

describe("usedPaths / pickPaths", () => {
  test("collects every row path the display reads", () => {
    const feed = {
      ...DEFAULT_FEED_CONFIG,
      columns: [
        { label: "T", type: "link" as const, key: "title", subKey: "sub", hrefKey: "url", style: { base: "", switchKey: "s" } },
      ],
      filterButtons: [{ label: "x", key: "kind", equals: "a" }],
      styles: { row: { base: "", switchKey: "state.code" } },
    };
    expect([...usedPaths(feed)].sort()).toEqual(["kind", "s", "state.code", "sub", "title", "url"]);
  });

  test("with no columns, keeps the fields the simple list shows", () => {
    expect(usedPaths(DEFAULT_FEED_CONFIG)).toContain("title");
  });

  test("keeps only those paths from each row", () => {
    const row = { title: "A", secret: "x", state: { code: 1, other: 2 }, list: [{ a: 1, b: 2 }] };
    expect(pickPaths(row, ["title", "state.code", "list.0.a", "missing"])).toEqual({
      title: "A",
      state: { code: 1 },
      list: [{ a: 1 }],
    });
  });

  test("never follows prototype keys", () => {
    expect(getPath({}, "constructor.name")).toBeUndefined();
    expect(pickPaths({ a: 1 }, ["__proto__.polluted", "a"])).toEqual({ a: 1 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  test("an empty path keeps the whole row", () => {
    expect(pickPaths("plain", [""])).toBe("plain");
    expect(pickPaths({ a: 1 }, ["", "a"])).toEqual({ a: 1 });
  });
});
