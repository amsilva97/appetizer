// @vitest-environment node
import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchLookups, runTransform } from "./runner";

describe("runTransform", () => {
  test("exposes body to the transform", () => {
    expect(runTransform({ items: [1, 2] }, "body.items.length")).toBe(2);
  });

  test("exposes lookup results as `lookups`, empty by default", () => {
    expect(runTransform({}, "lookups.length")).toBe(0);
    expect(runTransform({ ids: [7] }, "lookups.map(l => l && l.title)", [{ title: "Dune" }, null])).toEqual([
      "Dune",
      null,
    ]);
  });
});

describe("fetchLookups", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("fetches each url with the feed headers and keeps the order", async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({ url })));
    vi.stubGlobal("fetch", fetchMock);
    const out = await fetchLookups(["http://a.test/1", "http://a.test/2"], { "X-Api-Key": "k" });
    expect(out).toEqual([{ url: "http://a.test/1" }, { url: "http://a.test/2" }]);
    expect(fetchMock).toHaveBeenCalledWith("http://a.test/1", expect.objectContaining({ headers: { "X-Api-Key": "k" } }));
  });

  test("a failed lookup becomes null instead of failing the feed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/bad")) throw new Error("boom");
        if (url.endsWith("/404")) return new Response("not found", { status: 404 });
        return new Response("{\"ok\":true}");
      })
    );
    expect(await fetchLookups(["http://a.test/bad", "http://a.test/404", "http://a.test/ok"], {})).toEqual([
      null,
      null,
      { ok: true },
    ]);
  });
});
