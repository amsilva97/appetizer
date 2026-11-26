import { afterEach, describe, expect, test, vi } from "vitest";
import { readLastPage, saveLastPage } from "./last-page";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("last page", () => {
  test("remembers the page between visits", () => {
    expect(readLastPage()).toBeNull();
    saveLastPage("media");
    expect(readLastPage()).toBe("media");
  });

  test("does nothing for an empty name", () => {
    saveLastPage("");
    expect(readLastPage()).toBeNull();
  });

  test("works without storage instead of throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => saveLastPage("media")).not.toThrow();
    expect(readLastPage()).toBeNull();
  });
});
