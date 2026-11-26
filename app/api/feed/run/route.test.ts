// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Viewer } from "@/lib/auth/viewer";
import { ALL_CAPABILITIES } from "@/types/permissions";

const viewer = vi.fn<() => Promise<Viewer>>();
const findSavedFeed = vi.fn();
const fetchFeed = vi.fn();
const runTransform = vi.fn();
const fetchLookups = vi.fn();

vi.mock("@/lib/auth/viewer", () => ({
  getViewer: () => viewer(),
  can: (v: Viewer, c: string) => v.capabilities.has(c as never),
  seesAllPages: (v: Viewer) => v.capabilities.has("pages:read") || v.permissions.has("admin-read"),
}));
vi.mock("@/lib/auth/keys", () => ({ readKeys: () => ({}), referencesKeys: () => false }));
vi.mock("@/lib/feed/resolve", () => ({ findSavedFeed: (...a: unknown[]) => findSavedFeed(...a) }));
vi.mock("@/lib/feed/runner", () => ({
  substituteHeaders: (h: Record<string, string>) => h,
  fetchFeed: (...a: unknown[]) => fetchFeed(...a),
  runTransform: (...a: unknown[]) => runTransform(...a),
  fetchLookups: (...a: unknown[]) => fetchLookups(...a),
}));

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
const USER: Viewer = { ...base, permissions: new Set(["media"]) };
const GUEST: Viewer = { ...base, loggedIn: false };

const SAVED = {
  method: "GET",
  url: "https://saved.test/api",
  headers: [{ key: "X-Api-Key", value: "{{key}}" }],
  transform: "body.items",
  pollInterval: 30,
  height: 200,
};

function call(body: unknown) {
  return POST(new Request("http://localhost/api/feed/run", { method: "POST", body: JSON.stringify(body) }));
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchFeed.mockResolvedValue({ items: [1] });
  runTransform.mockReturnValue([1]);
});

describe("POST /api/feed/run", () => {
  test("rejects guests", async () => {
    viewer.mockResolvedValue(GUEST);
    const res = await call({ page: "home", widgetId: "w" });
    expect(res.status).toBe(401);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  test("admins can run unsaved config sent from the editor", async () => {
    viewer.mockResolvedValue(ADMIN);
    const res = await call({ url: "https://draft.test", headers: { A: "b" }, transform: "body" });
    expect(res.status).toBe(200);
    expect(fetchFeed).toHaveBeenCalledWith("https://draft.test", { A: "b" });
    expect(findSavedFeed).not.toHaveBeenCalled();
  });

  test("non-admins get the saved feed and their own url, headers and transform are ignored", async () => {
    viewer.mockResolvedValue(USER);
    findSavedFeed.mockReturnValue(SAVED);
    const res = await call({
      page: "home",
      widgetId: "w",
      url: "http://10.0.1.1:22",
      headers: { Evil: "1" },
      transform: "this.constructor.constructor('return process')()",
    });
    expect(res.status).toBe(200);
    expect(findSavedFeed).toHaveBeenCalledWith("home", "w", USER.permissions, false);
    expect(fetchFeed).toHaveBeenCalledWith(SAVED.url, { "X-Api-Key": "{{key}}" });
    expect(runTransform).toHaveBeenCalledWith({ items: [1] }, SAVED.transform, []);
  });

  test("non-admins get 404 for widgets they can't see", async () => {
    viewer.mockResolvedValue(USER);
    findSavedFeed.mockReturnValue(null);
    const res = await call({ page: "home", widgetId: "hidden", url: "https://x.test" });
    expect(res.status).toBe(404);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  test("non-admins must name a page and widget", async () => {
    viewer.mockResolvedValue(USER);
    const res = await call({ url: "https://x.test" });
    expect(res.status).toBe(400);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  test("admins without a url fall back to the saved feed", async () => {
    viewer.mockResolvedValue(ADMIN);
    findSavedFeed.mockReturnValue(SAVED);
    const res = await call({ page: "home", widgetId: "w" });
    expect(res.status).toBe(200);
    expect(fetchFeed).toHaveBeenCalledWith(SAVED.url, expect.any(Object));
  });

  test("still rejects non-http urls from admins", async () => {
    viewer.mockResolvedValue(ADMIN);
    const res = await call({ url: "file:///etc/passwd" });
    expect(res.status).toBe(400);
    expect(fetchFeed).not.toHaveBeenCalled();
  });

  describe("lookups", () => {
    test("runs the saved lookups and hands their results to the transform", async () => {
      viewer.mockResolvedValue(USER);
      findSavedFeed.mockReturnValue({ ...SAVED, lookups: "body.ids.map(i => '/item/' + i)" });
      fetchFeed.mockResolvedValue({ ids: [1, 2] });
      runTransform.mockImplementation((_b: unknown, code: string) =>
        code.startsWith("body.ids") ? ["/item/1", "/item/2"] : ["done"]
      );
      fetchLookups.mockResolvedValue([{ name: "one" }, null]);

      // A non-admin's own lookups are ignored like the rest of their config.
      const res = await call({ page: "home", widgetId: "w", lookups: "['http://10.0.1.1/']" });

      expect(res.status).toBe(200);
      expect(fetchLookups).toHaveBeenCalledWith(
        ["https://saved.test/item/1", "https://saved.test/item/2"],
        { "X-Api-Key": "{{key}}" }
      );
      expect(runTransform).toHaveBeenLastCalledWith({ ids: [1, 2] }, SAVED.transform, [{ name: "one" }, null]);
      expect(await res.json()).toEqual({ data: ["done"] });
    });

    test("refuses lookups that leave the feed's host", async () => {
      viewer.mockResolvedValue(ADMIN);
      runTransform.mockReturnValue(["http://elsewhere.test/x"]);
      const res = await call({ url: "https://draft.test/api", lookups: "L", transform: "body" });
      expect(res.status).toBe(422);
      expect(fetchLookups).not.toHaveBeenCalled();
    });

    test("admins can preview unsaved lookups", async () => {
      viewer.mockResolvedValue(ADMIN);
      runTransform.mockImplementation((_b: unknown, code: string) => (code === "L" ? ["/a"] : []));
      fetchLookups.mockResolvedValue([{}]);
      const res = await call({ url: "https://draft.test/api", lookups: "L", transform: "T" });
      expect(res.status).toBe(200);
      expect(fetchLookups).toHaveBeenCalledWith(["https://draft.test/a"], {});
    });
  });
});
