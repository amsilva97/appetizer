import { describe, expect, test, vi } from "vitest";

const destroy = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSession: async () => ({ destroy }) }));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  test("destroys the session and answers with JSON, not a redirect", async () => {
    const res = await POST();
    expect(destroy).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(await res.json()).toEqual({ ok: true });
  });
});
