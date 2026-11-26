import { describe, expect, test } from "vitest";
import { isSafeLink, isWebUrl } from "./links";

describe("isSafeLink", () => {
  test("accepts http, https and mailto only", () => {
    expect(isSafeLink("https://a.test")).toBe(true);
    expect(isSafeLink("http://a.test")).toBe(true);
    expect(isSafeLink("mailto:a@a.test")).toBe(true);
    expect(isSafeLink("javascript:alert(1)")).toBe(false);
    expect(isSafeLink("data:text/html,hi")).toBe(false);
    expect(isSafeLink("/relative")).toBe(false);
    expect(isSafeLink(42)).toBe(false);
  });
});

describe("isWebUrl", () => {
  test("accepts http and https only", () => {
    expect(isWebUrl("https://a.test/x.png")).toBe(true);
    expect(isWebUrl("mailto:a@a.test")).toBe(false);
    expect(isWebUrl("javascript:alert(1)")).toBe(false);
  });
});
