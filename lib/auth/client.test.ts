import { afterEach, describe, expect, test, vi } from "vitest";
import { redirectIfSignInRequired, signOut } from "@/lib/auth/client";

afterEach(() => vi.unstubAllGlobals());

describe("signOut", () => {
  test("ends the session, then reloads the homepage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);
    const go = vi.fn();
    await signOut(go);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(go).toHaveBeenCalledWith("/");
  });

  test("still reloads when the request fails, so the page never shows a stale user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const go = vi.fn();
    await expect(signOut(go)).rejects.toThrow("Failed to fetch");
    expect(go).toHaveBeenCalledWith("/");
  });
});

describe("redirectIfSignInRequired", () => {
  test("sends a 401 (guest viewing off) to the sign-in page", () => {
    const go = vi.fn();
    expect(redirectIfSignInRequired(new Response(null, { status: 401 }), go)).toBe(true);
    expect(go).toHaveBeenCalledWith("/login");
  });

  test("leaves anything else alone", () => {
    const go = vi.fn();
    expect(redirectIfSignInRequired(new Response("{}", { status: 200 }), go)).toBe(false);
    expect(redirectIfSignInRequired(new Response(null, { status: 403 }), go)).toBe(false);
    expect(go).not.toHaveBeenCalled();
  });
});
