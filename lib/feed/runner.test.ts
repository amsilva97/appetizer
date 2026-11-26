// @vitest-environment node
import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchMany, runStep } from "./runner";

describe("runStep", () => {
  test("transform turns the input into a list", () => {
    expect(runStep("transform", "body => body.items", { items: [1, 2] }, {})).toEqual({ value: [1, 2] });
  });

  test("a step can define helpers before the function", () => {
    const code = "const double = n => n * 2;\nrow => double(row)";
    expect(runStep("map", code, [1, 2], {})).toEqual({ value: [2, 4] });
  });

  test("map transforms each row and passes the index", () => {
    expect(runStep("map", "(row, i) => row + i", [10, 20], {})).toEqual({ value: [10, 21] });
  });

  test("filter keeps rows the function returns truthy for", () => {
    expect(runStep("filter", "row => row.keep", [{ keep: 1, n: 1 }, { keep: 0, n: 2 }], {})).toEqual({
      value: [{ keep: 1, n: 1 }],
    });
  });

  test("transform must return a list", () => {
    expect(() => runStep("transform", "body => body", { a: 1 }, {})).toThrow(/list/);
    expect(() => runStep("transform", "body => '<b>html</b>'", {}, {})).toThrow(/list/);
  });

  test("map and filter need a list to work on", () => {
    expect(() => runStep("map", "r => r", { a: 1 }, {})).toThrow(/list/);
  });

  test("the code must evaluate to a function", () => {
    expect(() => runStep("map", "42", [1], {})).toThrow(/function/);
  });

  test("async steps are rejected with a hint, since get() is synchronous", () => {
    expect(() => runStep("map", "async row => row", [1], {})).toThrow(/async/);
  });

  test("errors name the row that failed", () => {
    expect(() => runStep("map", "row => row.a.b", [{ a: {} }, {}], {})).toThrow(/row 2/);
  });

  test("get() for something not fetched yet asks for it, collecting every row's request", () => {
    const out = runStep("map", "row => get('/item/' + row)", [1, 2, 1], {});
    expect(out).toEqual({ pending: ["/item/1", "/item/2"] });
  });

  test("get() returns fetched data, a fresh copy each call", () => {
    const cache = { "/item/1": JSON.stringify({ name: "one" }) };
    const code = "row => { const a = get('/item/1'); a.name = 'changed'; return get('/item/1').name; }";
    expect(runStep("map", code, [1], cache)).toEqual({ value: ["one"] });
  });

  test("the sandbox can't reach the host", () => {
    expect(() => runStep("map", "r => process.env", [1], {})).toThrow();
    expect(() => runStep("map", "r => get.constructor('return process')()", [1], {})).toThrow();
  });

  test("an endless loop is stopped", () => {
    expect(() => runStep("map", "r => { for (;;) {} }", [1], {}, 50)).toThrow();
  });
});

describe("fetchMany", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("fetches every url with the headers and keeps the order", async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({ url })));
    vi.stubGlobal("fetch", fetchMock);
    const out = await fetchMany(["http://a.test/1", "http://a.test/2"], { "X-Api-Key": "k" }, 1000);
    expect(out).toEqual([{ url: "http://a.test/1" }, { url: "http://a.test/2" }]);
    expect(fetchMock).toHaveBeenCalledWith("http://a.test/1", expect.objectContaining({ headers: { "X-Api-Key": "k" } }));
  });

  test("a failed request becomes null instead of failing the feed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/bad")) throw new Error("boom");
        if (url.endsWith("/404")) return new Response("nope", { status: 404 });
        return new Response('{"ok":true}');
      })
    );
    expect(await fetchMany(["http://a.test/bad", "http://a.test/404", "http://a.test/ok"], {}, 1000)).toEqual([
      null,
      null,
      { ok: true },
    ]);
  });

  test("runs at most a few requests at once", async () => {
    let running = 0;
    let peak = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((r) => setTimeout(r, 5));
        running--;
        return new Response("1");
      })
    );
    await fetchMany(Array.from({ length: 30 }, (_, i) => `http://a.test/${i}`), {}, 1000);
    expect(peak).toBeLessThanOrEqual(8);
  });
});
