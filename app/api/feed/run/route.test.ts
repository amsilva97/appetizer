// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Viewer } from "@/lib/auth/viewer";
import { ALL_CAPABILITIES } from "@/types/permissions";

const viewer = vi.fn<() => Promise<Viewer>>();
const findSavedFeed = vi.fn();
const fetchFeed = vi.fn();
const runPipeline = vi.fn();

vi.mock("@/lib/auth/viewer", () => ({
  getViewer: () => viewer(),
  can: (v: Viewer, c: string) => v.capabilities.has(c as never),
  seesAllPages: (v: Viewer) => v.capabilities.has("pages:read") || v.permissions.has("admin-read"),
}));
vi.mock("@/lib/auth/keys", () => ({ readKeys: () => ({}), referencesKeys: (v: string) => v.includes("{") }));
vi.mock("@/lib/feed/resolve", () => ({ findSavedFeed: (...a: unknown[]) => findSavedFeed(...a) }));
vi.mock("@/lib/feed/runner", () => ({
  substituteHeaders: (h: Record<string, string>) => h,
  fetchFeed: (...a: unknown[]) => fetchFeed(...a),
}));
vi.mock("@/lib/feed/pipeline", () => ({ runPipeline: (...a: unknown[]) => runPipeline(...a) }));

const { POST } = await import("./route");

const base: Viewer = {
  loggedIn: true,
  username: "x",
  isAdmin: false,
  isAdminAccount: false,
  ipAllowed: true,
  clientIp: null,
  permissions: new Set(),
  capabilities: new Set(),
};
const ADMIN: Viewer = { ...base, isAdmin: true, isAdminAccount: true, capabilities: new Set(ALL_CAPABILITIES) };
const EDITOR_NO_KEYS: Viewer = { ...base, capabilities: new Set(["pages:update"] as never[]) };
const USER: Viewer = { ...base, permissions: new Set(["media"]) };
const GUEST: Viewer = { ...base, loggedIn: false };

const SAVED = {
  method: "GET",
  url: "https://saved.test/api",
  headers: [{ key: "X-Api-Key", value: "{KEY}" }],
  steps: [{ kind: "transform", code: "b => b.items" }],
  columns: [{ label: "Name", type: "text", key: "name" }],
  pollInterval: 30,
  height: 200,
};

function call(body: unknown) {
  return POST(new Request("http://localhost/api/feed/run", { method: "POST", body: JSON.stringify(body) }));
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchFeed.mockResolvedValue({ items: [] });
  runPipeline.mockResolvedValue([{ name: "A", secret: "hidden" }]);
});

describe("POST /api/feed/run", () => {
  test("rejects guests", async () => {
    viewer.mockResolvedValue(GUEST);
    const res = await call({ page: "home", widgetId: "w" });
    expect(res.status).toBe(401);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  test("editors can run an unsaved feed sent from the editor", async () => {
    viewer.mockResolvedValue(ADMIN);
    const res = await call({ feed: { ...SAVED, url: "https://draft.test", headers: [{ key: "A", value: "b" }] } });
    expect(res.status).toBe(200);
    expect(fetchFeed).toHaveBeenCalledWith("https://draft.test", { A: "b" }, expect.any(Number));
    expect(runPipeline).toHaveBeenCalledWith(
      { items: [] },
      SAVED.steps,
      expect.objectContaining({ feedUrl: "https://draft.test", headers: { A: "b" } })
    );
    expect(findSavedFeed).not.toHaveBeenCalled();
  });

  test("viewers get the saved feed and anything they send is ignored", async () => {
    viewer.mockResolvedValue(USER);
    findSavedFeed.mockReturnValue(SAVED);
    const res = await call({
      page: "home",
      widgetId: "w",
      feed: { method: "GET", url: "http://10.0.1.1:22", steps: [{ kind: "map", code: "r => process" }] },
    });
    expect(res.status).toBe(200);
    expect(findSavedFeed).toHaveBeenCalledWith("home", "w", USER.permissions, false);
    expect(fetchFeed).toHaveBeenCalledWith(SAVED.url, { "X-Api-Key": "{KEY}" }, expect.any(Number));
    expect(runPipeline).toHaveBeenCalledWith({ items: [] }, SAVED.steps, expect.any(Object));
  });

  test("editors without keys:read can't preview a feed that uses keys, so they get the saved one", async () => {
    viewer.mockResolvedValue(EDITOR_NO_KEYS);
    findSavedFeed.mockReturnValue(SAVED);
    await call({ page: "home", widgetId: "w", feed: { ...SAVED, url: "https://draft.test" } });
    expect(fetchFeed).toHaveBeenCalledWith(SAVED.url, expect.any(Object), expect.any(Number));
  });

  test("viewers get 404 for widgets they can't see", async () => {
    viewer.mockResolvedValue(USER);
    findSavedFeed.mockReturnValue(null);
    const res = await call({ page: "home", widgetId: "hidden" });
    expect(res.status).toBe(404);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  test("viewers must name a page and widget", async () => {
    viewer.mockResolvedValue(USER);
    const res = await call({ feed: SAVED });
    expect(res.status).toBe(400);
  });

  test("rejects non-http urls", async () => {
    viewer.mockResolvedValue(ADMIN);
    const res = await call({ feed: { ...SAVED, url: "file:///etc/passwd" } });
    expect(res.status).toBe(400);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  test("rejects oversized step code", async () => {
    viewer.mockResolvedValue(ADMIN);
    const res = await call({ feed: { ...SAVED, steps: [{ kind: "map", code: "x".repeat(20_001) }] } });
    expect(res.status).toBe(400);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  test("a failing step comes back as a 422 with its message", async () => {
    viewer.mockResolvedValue(ADMIN);
    runPipeline.mockRejectedValue(new Error("Step 2 (map): row 1: boom"));
    const res = await call({ feed: SAVED });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: "Step 2 (map): row 1: boom" });
  });

  test("an unreachable source is a 502", async () => {
    viewer.mockResolvedValue(ADMIN);
    fetchFeed.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const res = await call({ feed: SAVED });
    expect(res.status).toBe(502);
  });

  test("sends only the fields the columns and buttons use", async () => {
    viewer.mockResolvedValue(ADMIN);
    const res = await call({ feed: SAVED });
    expect(await res.json()).toEqual({ data: [{ name: "A" }] });
  });

  test("caps how many rows are sent", async () => {
    viewer.mockResolvedValue(ADMIN);
    runPipeline.mockResolvedValue(Array.from({ length: 1500 }, (_, i) => ({ name: i })));
    const res = await call({ feed: SAVED });
    expect(((await res.json()) as { data: unknown[] }).data).toHaveLength(1000);
  });
});
