import { describe, expect, test } from "vitest";
import { normalizeFeed } from "./normalize";
import { DEFAULT_FEED_CONFIG } from "@/types/feed";

describe("normalizeFeed", () => {
  test("keeps a row link and defaults it to empty", () => {
    expect(normalizeFeed({ rowLink: "http://a.test/{id}" }).rowLink).toBe("http://a.test/{id}");
    expect(normalizeFeed({ rowLink: null }).rowLink).toBe("");
    expect(normalizeFeed({}).rowLink).toBe("");
  });

  test("anything that isn't an object becomes the empty feed", () => {
    expect(normalizeFeed(undefined)).toEqual(DEFAULT_FEED_CONFIG);
    expect(normalizeFeed("x")).toEqual(DEFAULT_FEED_CONFIG);
  });

  test("fills in missing lists and keeps what's there", () => {
    const feed = normalizeFeed({ method: "GET", url: "http://a.test", columns: [{ label: "Name", key: "name" }] });
    expect(feed.method).toBe("GET");
    expect(feed.steps).toEqual([]);
    expect(feed.filterButtons).toEqual([]);
    expect(feed.styles).toEqual({});
    expect(feed.columns).toEqual([{ label: "Name", key: "name", type: "text" }]);
  });

  test("drops malformed steps, headers, columns and buttons", () => {
    const feed = normalizeFeed({
      steps: [{ kind: "map", code: "r => r" }, { kind: "eval", code: "x" }, "nope", { kind: "filter" }],
      headers: [{ key: "A", value: "b" }, { key: 1 }],
      columns: [null, { key: "a", type: "weird" }],
      filterButtons: [{ label: "P", key: "s", equals: 1 }, {}],
    });
    expect(feed.steps).toEqual([{ kind: "map", code: "r => r" }, { kind: "filter", code: "" }]);
    expect(feed.headers).toEqual([{ key: "A", value: "b" }]);
    expect(feed.columns).toEqual([{ label: "", key: "a", type: "text" }]);
    expect(feed.filterButtons).toEqual([{ label: "P", key: "s", equals: "1" }]);
  });

  test("turns an old single transform into a first transform step", () => {
    const feed = normalizeFeed({ method: "GET", url: "http://a.test", transform: "body.items" });
    expect(feed.steps).toHaveLength(1);
    expect(feed.steps[0].kind).toBe("transform");
    expect("transform" in feed).toBe(false);
  });

  test("ignores the old transform once steps exist", () => {
    const feed = normalizeFeed({ transform: "body.items", steps: [{ kind: "map", code: "r => r" }] });
    expect(feed.steps).toEqual([{ kind: "map", code: "r => r" }]);
  });
});
