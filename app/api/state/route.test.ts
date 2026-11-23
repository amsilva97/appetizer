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
vi.mock("@/lib/auth/users", () => ({
  findUser: (name: string) =>
    name === "viewer" ? { username: "viewer", role: "user", permissions: [] } :
    name === "media" ? { username: "media", role: "user", permissions: ["media"] } : null,
}));
vi.mock("@/lib/auth/permissions", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth/permissions")>()),
  readPermissionsConfig: () => ({ permissions: [], roles: [] }),
}));

const { GET } = await import("./route");

const app = (id: string, extra: object = {}) => ({ id, type: "app", x: 0, y: 0, config: { title: id }, ...extra });

beforeEach(() => {
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
  return (await res.json()) as { layout: { widgets: { id: string }[]; mobile: { slots: string[] } } };
}

describe("GET /api/state hides restricted apps on desktop and phone", () => {
  test.each([
    ["a guest", { loggedIn: false }, ["open"]],
    ["a user without permissions", { loggedIn: true, role: "user", username: "viewer" }, ["open"]],
    ["a user with the media permission", { loggedIn: true, role: "user", username: "media" }, ["open", "media-only"]],
  ])("%s only gets the apps they're allowed", async (_who, s, expected) => {
    session.mockResolvedValue(s);
    const { layout } = await state();
    expect(layout.widgets.filter((w) => w.id !== "tools").map((w) => w.id)).toEqual(expected);
    expect(layout.mobile.slots).toEqual(expected);
  });

  test("admins get everything", async () => {
    session.mockResolvedValue({ loggedIn: true, role: "admin", username: "root" });
    const { layout } = await state();
    expect(layout.mobile.slots).toEqual(["open", "locked", "media-only", "in-locked-menu"]);
  });
});
