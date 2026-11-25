import { describe, expect, test } from "vitest";
import { MAX_LOOKUPS, resolveLookupUrls } from "./lookups";

const FEED = "http://seerr.lxc:5055/api/v1/request?take=20";

describe("resolveLookupUrls", () => {
  test("resolves paths against the feed url", () => {
    expect(resolveLookupUrls(["/api/v1/movie/603", "/api/v1/tv/1399"], FEED)).toEqual([
      "http://seerr.lxc:5055/api/v1/movie/603",
      "http://seerr.lxc:5055/api/v1/tv/1399",
    ]);
  });

  test("accepts absolute urls on the same host", () => {
    expect(resolveLookupUrls(["http://seerr.lxc:5055/api/v1/movie/1"], FEED)).toEqual([
      "http://seerr.lxc:5055/api/v1/movie/1",
    ]);
  });

  test("rejects urls on another host so feed headers never leave the feed's host", () => {
    expect(() => resolveLookupUrls(["http://evil.test/steal"], FEED)).toThrow(/feed's host/);
    expect(() => resolveLookupUrls(["//evil.test/steal"], FEED)).toThrow(/feed's host/);
    expect(() => resolveLookupUrls(["http://seerr.lxc:22/"], FEED)).toThrow(/feed's host/);
  });

  test("rejects anything that isn't an array of strings", () => {
    expect(() => resolveLookupUrls("nope", FEED)).toThrow(/array/);
    expect(() => resolveLookupUrls([1], FEED)).toThrow(/string/);
  });

  test("caps the number of lookups", () => {
    const urls = Array.from({ length: MAX_LOOKUPS + 1 }, (_, i) => `/x/${i}`);
    expect(() => resolveLookupUrls(urls, FEED)).toThrow(/max/);
    expect(resolveLookupUrls(urls.slice(0, MAX_LOOKUPS), FEED)).toHaveLength(MAX_LOOKUPS);
  });
});
