import { describe, expect, test } from "vitest";
import { isSafeLink, sanitizeFeedHtml } from "./sanitize";

function render(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = sanitizeFeedHtml(html);
  return el;
}

describe("sanitizeFeedHtml", () => {
  test("keeps http links and forces a new tab without opener access", () => {
    const a = render('<a href="https://example.test/x">x</a>').querySelector("a")!;
    expect(a.getAttribute("href")).toBe("https://example.test/x");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer nofollow");
  });

  test("overrides a target or rel the feed set itself", () => {
    const a = render('<a href="https://example.test" target="_top" rel="opener">x</a>').querySelector("a")!;
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer nofollow");
  });

  test("strips javascript:, data: and relative hrefs", () => {
    for (const href of ["javascript:alert(1)", "data:text/html,hi", "/admin", "//evil.test"]) {
      const a = render(`<a href="${href}">x</a>`).querySelector("a")!;
      expect(a.hasAttribute("href"), href).toBe(false);
    }
  });

  test("allows images and other normal HTML now that the tag allowlist is gone", () => {
    const el = render('<img src="https://example.test/a.png"><details><summary>s</summary>b</details>');
    expect(el.querySelector("img")?.getAttribute("src")).toBe("https://example.test/a.png");
    expect(el.querySelector("details")).not.toBeNull();
  });

  test("removes scripts, event handlers, style tags and form controls", () => {
    const el = render(
      '<script>x()</script><img src="https://e.test/a.png" onerror="x()"><style>body{}</style>' +
        '<form><input name="password"><button>go</button></form>'
    );
    expect(el.querySelector("script, style, form, input, button")).toBeNull();
    expect(el.querySelector("img")?.hasAttribute("onerror")).toBe(false);
  });
});

describe("isSafeLink", () => {
  test("accepts http, https and mailto only", () => {
    expect(isSafeLink("https://a.test")).toBe(true);
    expect(isSafeLink("http://a.test")).toBe(true);
    expect(isSafeLink("mailto:a@a.test")).toBe(true);
    expect(isSafeLink("javascript:alert(1)")).toBe(false);
    expect(isSafeLink("/relative")).toBe(false);
    expect(isSafeLink(42)).toBe(false);
  });
});
