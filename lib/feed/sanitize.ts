import DOMPurify from "dompurify";

/**
 * Feed HTML gets DOMPurify's normal HTML profile (links, images, tables, etc.)
 * minus a few tags that could reach outside the widget: <style> restyles the
 * whole dashboard, and form controls could be used to phish credentials.
 * Scripts and event handlers are always stripped by DOMPurify.
 */
const FEED_SANITIZE: DOMPurify.Config = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "option"],
  FORCE_BODY: true,
};

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** True for absolute http(s)/mailto URLs, the only links a feed may emit. */
export function isSafeLink(href: unknown): href is string {
  if (typeof href !== "string") return false;
  try {
    return SAFE_LINK_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

let hookInstalled = false;

function installLinkHook(): void {
  if (hookInstalled) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName !== "A") return;
    const href = node.getAttribute("href");
    if (!isSafeLink(href)) {
      node.removeAttribute("href");
      node.removeAttribute("target");
      return;
    }
    // Always open in a new tab, and don't hand the dashboard window to the target.
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer nofollow");
  });
  hookInstalled = true;
}

export function sanitizeFeedHtml(html: string): string {
  if (typeof window === "undefined") return "";
  installLinkHook();
  return DOMPurify.sanitize(html, FEED_SANITIZE as Parameters<typeof DOMPurify.sanitize>[1]) as string;
}
