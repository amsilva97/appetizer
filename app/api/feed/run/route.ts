import { NextResponse } from "next/server";
import { can, getViewer, seesAllPages } from "@/lib/auth/viewer";
import { readKeys, referencesKeys } from "@/lib/auth/keys";
import { substituteHeaders, fetchFeed, fetchLookups, runTransform } from "@/lib/feed/runner";
import { resolveLookupUrls } from "@/lib/feed/lookups";
import { findSavedFeed } from "@/lib/feed/resolve";

interface RunRequest {
  /** Page and widget the feed belongs to. Required for non-admins. */
  page?: string;
  widgetId?: string;
  /** Live config. Honoured only for admins, who preview unsaved widgets. */
  url?: string;
  headers?: Record<string, string>;
  transform?: string;
  lookups?: string;
}

interface FeedJob {
  url: string;
  headers: Record<string, string>;
  transform?: string;
  /** Expression returning follow-up URLs on the feed's host. */
  lookups?: string;
}

const MAX_TRANSFORM_CHARS = 4096;

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Layout editors (pages:update) can run feed config they send, to preview
 * unsaved widgets; using secret keys in that config also needs keys:read.
 * Everyone else can only run the feed saved on a widget they can see; anything
 * else in the request is ignored. Without this, any logged-in user could make
 * the server fetch arbitrary URLs and run arbitrary transform code.
 */
async function resolveJob(body: RunRequest): Promise<FeedJob | NextResponse> {
  const viewer = await getViewer();
  if (!viewer.loggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (typeof body.url === "string" && can(viewer, "pages:update")) {
    const headers = body.headers && typeof body.headers === "object" ? body.headers : {};
    // Editors without keys:read fall through to the saved feed, so keyed feeds
    // still load for them; they just can't preview changes to one.
    if (!Object.values(headers).some(referencesKeys) || can(viewer, "keys:read")) {
      return { url: body.url, headers, transform: body.transform, lookups: body.lookups };
    }
  }

  if (typeof body.page !== "string" || typeof body.widgetId !== "string") {
    return NextResponse.json({ error: "page and widgetId required" }, { status: 400 });
  }
  const feed = findSavedFeed(body.page, body.widgetId, viewer.permissions, seesAllPages(viewer));
  if (!feed) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }
  return {
    url: feed.url,
    headers: Object.fromEntries(
      (feed.headers ?? []).filter((h) => h.key.trim()).map((h) => [h.key, h.value])
    ),
    transform: feed.transform || undefined,
    lookups: feed.lookups || undefined,
  };
}

export async function POST(request: Request) {
  let body: RunRequest;
  try {
    body = (await request.json()) as RunRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const job = await resolveJob(body);
  if (job instanceof NextResponse) return job;
  const { url, headers, transform, lookups } = job;

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid or missing URL" }, { status: 400 });
  }
  if (typeof transform === "string" && transform.length > MAX_TRANSFORM_CHARS) {
    return NextResponse.json({ error: `Transform too long (max ${MAX_TRANSFORM_CHARS} chars)` }, { status: 400 });
  }
  if (lookups !== undefined && (typeof lookups !== "string" || lookups.length > MAX_TRANSFORM_CHARS)) {
    return NextResponse.json({ error: `Lookups must be an expression of at most ${MAX_TRANSFORM_CHARS} chars` }, { status: 400 });
  }

  const resolvedHeaders = substituteHeaders(headers, readKeys());

  let responseBody: unknown;
  try {
    responseBody = await fetchFeed(url, resolvedHeaders);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream error";
    const isTimeout = msg.toLowerCase().includes("abort") || msg.toLowerCase().includes("timeout");
    return NextResponse.json({ error: msg }, { status: isTimeout ? 504 : 502 });
  }

  if (!transform) {
    return NextResponse.json({ data: responseBody });
  }

  let lookupResults: unknown[] = [];
  if (lookups) {
    let lookupUrls: string[];
    try {
      lookupUrls = resolveLookupUrls(runTransform(responseBody, lookups), url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lookups error";
      return NextResponse.json({ error: `Lookups failed: ${msg}` }, { status: 422 });
    }
    lookupResults = await fetchLookups(lookupUrls, resolvedHeaders);
  }

  let result: unknown;
  try {
    result = runTransform(responseBody, transform, lookupResults);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transform error";
    return NextResponse.json({ error: `Transform failed: ${msg}` }, { status: 422 });
  }

  if (!Array.isArray(result) && typeof result !== "string") {
    return NextResponse.json(
      { error: "Transform must return an array or an HTML string" },
      { status: 422 }
    );
  }

  return NextResponse.json({ data: result });
}
