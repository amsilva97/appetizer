/** Most follow-up requests one feed run may make. */
export const MAX_LOOKUPS = 25;

/**
 * Check what a feed's lookups expression returned and turn it into absolute
 * URLs. Paths resolve against the feed URL, and every URL must stay on the
 * feed's own origin: lookups reuse the feed's headers, secret keys included,
 * so they must never reach another host.
 */
export function resolveLookupUrls(value: unknown, feedUrl: string): string[] {
  if (!Array.isArray(value)) throw new Error("Lookups must return an array of URLs");
  if (value.length > MAX_LOOKUPS) throw new Error(`Too many lookups (max ${MAX_LOOKUPS})`);

  const origin = new URL(feedUrl).origin;
  return value.map((entry) => {
    if (typeof entry !== "string") throw new Error("Each lookup must be a URL string");
    const url = new URL(entry, feedUrl);
    if (url.origin !== origin) throw new Error("Lookups must stay on the feed's host");
    return url.href;
  });
}
