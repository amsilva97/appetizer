// @vitest-environment node
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import * as yaml from "js-yaml";

// The data folder is resolved from process.cwd() when lib/data/layouts loads, so point it at a temp dir first.
const root = mkdtempSync(join(tmpdir(), "appetizer-state-"));
mkdirSync(join(root, "data"));
vi.spyOn(process, "cwd").mockReturnValue(root);

const session = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: () => session() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth/users", () => ({
  findUser: (name: string) =>
    name === "root" ? { username: "root", role: "admin", disabled: false } :
    name === "viewer" ? { username: "viewer", role: "user", permissions: [] } :
    name === "media" ? { username: "media", role: "user", permissions: ["media"] } :
    name === "reader" ? { username: "reader", role: "user", permissions: ["admin-read"] } : null,
}));
vi.mock("@/lib/auth/permissions", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth/permissions")>()),
  readPermissionsConfig: () => ({ permissions: [], roles: [] }),
}));

const { GET } = await import("./route");

const app = (id: string, extra: object = {}) => ({ id, type: "app", x: 0, y: 0, config: { title: id }, ...extra });

beforeEach(() => {
  // Guests are part of these cases, so Force Login is off.
  writeFileSync(join(root, "data", "settings.yaml"), yaml.dump({ forceLogin: false }));
  writeFileSync(join(root, "data", "index.yaml"), yaml.dump({ active: "home", mobileEnabled: true, pages: [{ name: "home", label: "Home", permissions: [] }] }));
  writeFileSync(
    join(root, "data", "home.yaml"),
    yaml.dump({
      name: "home",
      widgets: [
        { id: "tools", type: "menu", x: 0, y: 0, permissions: ["admin"], config: { label: "Tools" } },
        app("open"),
        app("locked", { permissions: ["admin"] }),
        app("media-only", { permissions: ["media"] }),
        app("in-locked-menu", { parentId: "tools" }),
      ],
      // Old multi-screen shape, as still saved on the test copy.
      mobile: { screens: [{ name: "main", label: "Apps", slots: ["open", "locked", "media-only", "in-locked-menu"] }] },
    })
  );
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

async function state() {
  const res = await GET(new Request("http://localhost/api/state"));
  return (await res.json()) as {
    pages: { name: string; phone?: boolean }[];
    layout: { widgets: { id: string }[]; mobile: { slots: { id: string }[] } };
  };
}

const slotIds = (layout: { mobile: { slots: { id: string }[] } }) => layout.mobile.slots.map((s) => s.id);

describe("GET /api/state hides restricted apps on desktop and phone", () => {
  test.each([
    ["a guest", { loggedIn: false }, ["open"]],
    ["a user without permissions", { loggedIn: true, role: "user", username: "viewer" }, ["open"]],
    ["a user with the media permission", { loggedIn: true, role: "user", username: "media" }, ["open", "media-only"]],
  ])("%s only gets the apps they're allowed", async (_who, s, expected) => {
    session.mockResolvedValue(s);
    const { layout } = await state();
    expect(layout.widgets.filter((w) => w.id !== "tools").map((w) => w.id)).toEqual(expected);
    expect(slotIds(layout)).toEqual(expected);
  });

  test("admins get everything", async () => {
    session.mockResolvedValue({ loggedIn: true, role: "admin", username: "root" });
    const { layout } = await state();
    expect(slotIds(layout)).toEqual(["open", "locked", "media-only", "in-locked-menu"]);
  });

  test("an admin outside the IP allowlist still sees everything (admin-read)", async () => {
    writeFileSync(
      join(root, "data", "settings.yaml"),
      yaml.dump({ forceLogin: false, adminIpAllowlist: { enabled: true, entries: ["10.0.0.0/8"] } })
    );
    session.mockResolvedValue({ loggedIn: true, role: "admin", username: "root" });
    const { layout } = await state();
    expect(slotIds(layout)).toEqual(["open", "locked", "media-only", "in-locked-menu"]);
  });

  test("a user granted admin-read sees everything", async () => {
    session.mockResolvedValue({ loggedIn: true, role: "user", username: "reader" });
    const { layout } = await state();
    expect(slotIds(layout)).toEqual(["open", "locked", "media-only", "in-locked-menu"]);
  });
});

describe("GET /api/state marks which pages have a phone version", () => {
  beforeEach(() => {
    writeFileSync(
      join(root, "data", "index.yaml"),
      yaml.dump({
        active: "home",
        mobileEnabled: true,
        pages: [
          { name: "home", label: "Home", permissions: [] },
          { name: "empty", label: "Empty", permissions: [] },
          { name: "secret", label: "Secret", permissions: [] },
        ],
      })
    );
    writeFileSync(join(root, "data", "empty.yaml"), yaml.dump({ name: "empty", widgets: [app("a")] }));
    writeFileSync(
      join(root, "data", "secret.yaml"),
      yaml.dump({ name: "secret", widgets: [app("s", { permissions: ["admin"] })], mobile: { slots: [{ id: "s", span: "half" }] } })
    );
  });

  test("a page counts only if the viewer would see a card on it", async () => {
    session.mockResolvedValue({ loggedIn: false });
    const { pages } = await state();
    expect(pages.map((p) => [p.name, p.phone])).toEqual([["home", true], ["empty", false], ["secret", false]]);
  });

  test("admins see the restricted card, so that page counts for them", async () => {
    session.mockResolvedValue({ loggedIn: true, role: "admin", username: "root" });
    const { pages } = await state();
    expect(pages.find((p) => p.name === "secret")?.phone).toBe(true);
  });

  test("pages aren't checked while the phone view is off", async () => {
    writeFileSync(join(root, "data", "index.yaml"), yaml.dump({ active: "home", pages: [{ name: "home", label: "Home", permissions: [] }] }));
    session.mockResolvedValue({ loggedIn: false });
    const { pages } = await state();
    expect(pages[0].phone).toBeUndefined();
  });
});
