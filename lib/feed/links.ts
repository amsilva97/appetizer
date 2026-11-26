const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const WEB_PROTOCOLS = new Set(["http:", "https:"]);

function hasProtocol(value: unknown, allowed: ReadonlySet<string>): value is string {
  if (typeof value !== "string") return false;
  try {
    return allowed.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** True for absolute http(s) and mailto URLs, the only links a feed may emit. */
export function isSafeLink(href: unknown): href is string {
  return hasProtocol(href, SAFE_LINK_PROTOCOLS);
}

/** True for absolute http(s) URLs: what link and image columns accept. */
export function isWebUrl(href: unknown): href is string {
  return hasProtocol(href, WEB_PROTOCOLS);
}
