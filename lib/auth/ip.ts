import { BlockList, isIP } from "node:net";

/**
 * Turn an address as it shows up in headers into a plain IP:
 * strips brackets and ports, and unwraps IPv4-mapped IPv6 (::ffff:10.0.0.1).
 * Returns null for anything that isn't an IP.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.trim();
  if (!ip) return null;

  const bracketed = ip.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketed) ip = bracketed[1];
  else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(":"));

  const zone = ip.indexOf("%");
  if (zone !== -1) ip = ip.slice(0, zone);

  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) ip = mapped[1];

  return isIP(ip) ? ip.toLowerCase() : null;
}

export interface ParsedEntry {
  address: string;
  prefix: number;
  family: "ipv4" | "ipv6";
}

/** Parse "192.0.2.5", "192.0.2.0/24" or "fd00::/8". Returns null when invalid. */
export function parseIpEntry(raw: string): ParsedEntry | null {
  const [addrPart, prefixPart, ...rest] = raw.trim().split("/");
  if (rest.length > 0) return null;
  const address = normalizeIp(addrPart);
  if (!address) return null;
  const family = isIP(address) === 4 ? "ipv4" : "ipv6";
  const max = family === "ipv4" ? 32 : 128;
  if (prefixPart === undefined) return { address, prefix: max, family };
  if (!/^\d{1,3}$/.test(prefixPart)) return null;
  const prefix = Number(prefixPart);
  if (prefix < 0 || prefix > max) return null;
  return { address, prefix, family };
}

function buildList(entries: readonly string[]): BlockList {
  const list = new BlockList();
  for (const raw of entries) {
    const entry = parseIpEntry(raw);
    if (entry) list.addSubnet(entry.address, entry.prefix, entry.family);
  }
  return list;
}

/** True when the IP falls inside any entry. Invalid entries are ignored. */
export function ipMatches(ip: string | null, entries: readonly string[]): boolean {
  const addr = normalizeIp(ip);
  if (!addr || entries.length === 0) return false;
  return buildList(entries).check(addr, isIP(addr) === 4 ? "ipv4" : "ipv6");
}

/** Proxies whose X-Forwarded-For entries we believe, from TRUSTED_PROXIES (comma separated). */
export function trustedProxiesFromEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.TRUSTED_PROXIES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Work out the real client IP from X-Forwarded-For.
 *
 * Next.js fills X-Forwarded-For with the socket address only when the header is
 * missing; a reverse proxy appends the address it saw. So we read the list
 * right to left and skip hops that belong to trusted proxies. The first
 * untrusted address is the client. Anything to its left was sent by the client
 * and can't be believed.
 */
export function clientIpFromForwardedFor(
  forwardedFor: string | null,
  trustedProxies: readonly string[]
): string | null {
  if (!forwardedFor) return null;
  const hops = forwardedFor.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = hops.length - 1; i >= 0; i--) {
    const ip = normalizeIp(hops[i]);
    if (!ip) return null; // garbage in the chain: refuse to guess
    if (i > 0 && ipMatches(ip, trustedProxies)) continue;
    return ip;
  }
  return null;
}

export function clientIpFromHeaders(
  headers: Headers,
  trustedProxies: readonly string[] = trustedProxiesFromEnv()
): string | null {
  return clientIpFromForwardedFor(headers.get("x-forwarded-for"), trustedProxies);
}
