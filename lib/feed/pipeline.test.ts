// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { runPipeline } from "./pipeline";
import type { FeedStep } from "@/types/feed";
import { normalizeFeed } from "./normalize";

const URL_ = "http://seerr.test:5055/api/v1/request?take=20";
const ctx = (over: Partial<Parameters<typeof runPipeline>[2]> = {}) => ({
  feedUrl: URL_,
  headers: { "X-Api-Key": "secret" },
  deadline: Date.now() + 5000,
  ...over,
});

const details: Record<string, unknown> = {
  "http://seerr.test:5055/api/v1/movie/603": { title: "The Matrix" },
  "http://seerr.test:5055/api/v1/tv/1399": { name: "Game of Thrones" },
};
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (url: string) =>
    url in details ? new Response(JSON.stringify(details[url])) : new Response("nope", { status: 404 })
  );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const body = {
  results: [
    { type: "movie", id: 603, status: 1 },
    { type: "tv", id: 1399, status: 5 },
  ],
};

describe("runPipeline", () => {
  test("with no steps a list body passes straight through", async () => {
    expect(await runPipeline([1, 2], [], ctx())).toEqual([1, 2]);
  });

  test("with no steps a non-list body is an error that says to add a transform", async () => {
    await expect(runPipeline(body, [], ctx())).rejects.toThrow(/transform/);
  });

  test("runs the steps in order", async () => {
    const steps: FeedStep[] = [
      { kind: "transform", code: "body => body.results" },
      { kind: "filter", code: "r => r.status !== 5" },
      { kind: "map", code: "r => r.id" },
    ];
    expect(await runPipeline(body, steps, ctx())).toEqual([603]);
  });

  test("map can get() details per row; requests go out once, with the feed's headers", async () => {
    const steps: FeedStep[] = [
      { kind: "transform", code: "body => body.results" },
      { kind: "map", code: "r => ({ id: r.id, title: (get('/api/v1/' + r.type + '/' + r.id) || {}).title || null })" },
    ];
    expect(await runPipeline(body, steps, ctx())).toEqual([
      { id: 603, title: "The Matrix" },
      { id: 1399, title: null },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://seerr.test:5055/api/v1/movie/603",
      expect.objectContaining({ headers: { "X-Api-Key": "secret" } })
    );
  });

  test("a get() that depends on an earlier get() works", async () => {
    details["http://seerr.test:5055/next"] = { path: "/api/v1/movie/603" };
    const steps: FeedStep[] = [{ kind: "transform", code: "b => [get(get('/next').path).title]" }];
    expect(await runPipeline({}, steps, ctx())).toEqual(["The Matrix"]);
  });

  test("get() can't leave the Get URL's host, so the key can't leak", async () => {
    for (const path of ["http://evil.test/x", "//evil.test/x", "http://seerr.test:22/x"]) {
      const steps: FeedStep[] = [{ kind: "transform", code: `b => [get(${JSON.stringify(path)})]` }];
      await expect(runPipeline({}, steps, ctx()), path).rejects.toThrow(/host/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("names the step that failed", async () => {
    const steps: FeedStep[] = [
      { kind: "transform", code: "b => b.results" },
      { kind: "map", code: "r => r.x.y" },
    ];
    await expect(runPipeline(body, steps, ctx())).rejects.toThrow(/Step 2 \(map\)/);
  });

  test("an old single-transform feed still runs as its first step", async () => {
    const { steps } = normalizeFeed({ transform: "const n = body.results.length; body.results.map(r => r.id * n)" });
    expect(await runPipeline(body, steps, ctx())).toEqual([1206, 2798]);
  });

  test("stops when the deadline has passed", async () => {
    const steps: FeedStep[] = [{ kind: "transform", code: "b => b.results" }];
    await expect(runPipeline(body, steps, ctx({ deadline: Date.now() - 1 }))).rejects.toThrow(/too long/);
  });
});
