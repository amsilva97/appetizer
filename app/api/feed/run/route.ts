import { NextResponse } from "next/server";
import { can, getViewer, seesAllPages } from "@/lib/auth/viewer";
import { readKeys, referencesKeys } from "@/lib/auth/keys";
import { fetchFeed, substituteHeaders } from "@/lib/feed/runner";
import { runPipeline } from "@/lib/feed/pipeline";
import { findSavedFeed } from "@/lib/feed/resolve";
import { normalizeFeed } from "@/lib/feed/normalize";
import { pickPaths, usedPaths } from "@/lib/feed/view";
import type { AppFeedConfig } from "@/types/feed";

interface RunRequest {
  /** Page and widget the feed belongs to. Required for viewers. */
  page?: string;
  widgetId?: string;
  /** Live feed config. Honoured only for layout editors, who preview unsaved widgets. */
  feed?: unknown;
}

const MAX_STEPS = 20;
const MAX_STEP_CHARS = 20_000;
/** Most rows sent to the browser. */
const MAX_ROWS = 1000;
/** Longest the main GET may take. */
const GET_TIMEOUT_MS = 5000;
/** Longest a whole feed run (GET, steps and their get() calls) may take. */
const RUN_TIMEOUT_MS = 10_000;

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function headerMap(feed: AppFeedConfig): Record<string, string> {
  return Object.fromEntries(feed.headers.filter((h) => h.key.trim()).map((h) => [h.key, h.value]));
}

/**
 * Layout editors (pages:update) can run feed config they send, to preview
 * unsaved widgets; using secret keys in that config also needs keys:read.
 * Everyone else can only run the feed saved on a widget they can see; anything
 * else in the request is ignored. Without this, any logged-in user could make
 * the server fetch arbitrary URLs and run arbitrary step code.
 */
async function resolveFeed(body: RunRequest): Promise<AppFeedConfig | NextResponse> {
  const viewer = await getViewer();
  if (!viewer.loggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.feed !== undefined && can(viewer, "pages:update")) {
    const draft = normalizeFeed(body.feed);
    // Editors without keys:read fall through to the saved feed, so keyed feeds
    // still load for them; they just can't preview changes to one.
    if (!draft.headers.some((h) => referencesKeys(h.value)) || can(viewer, "keys:read")) {
      return draft;
    }
  }

  if (typeof body.page !== "string" || typeof body.widgetId !== "string") {
    return NextResponse.json({ error: "page and widgetId required" }, { status: 400 });
  }
  const saved = findSavedFeed(body.page, body.widgetId, viewer.permissions, seesAllPages(viewer));
  if (!saved) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }
  return normalizeFeed(saved);
}

function validate(feed: AppFeedConfig): string | null {
  if (!isValidUrl(feed.url)) return "Invalid or missing URL";
  if (feed.steps.length > MAX_STEPS) return `Too many steps (max ${MAX_STEPS})`;
  if (feed.steps.some((s) => s.code.length > MAX_STEP_CHARS)) return `Step code too long (max ${MAX_STEP_CHARS} chars)`;
  return null;
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

  const feed = await resolveFeed(body);
  if (feed instanceof NextResponse) return feed;
  const invalid = validate(feed);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const deadline = Date.now() + RUN_TIMEOUT_MS;
  const headers = substituteHeaders(headerMap(feed), readKeys());

  let responseBody: unknown;
  try {
    responseBody = await fetchFeed(feed.url, headers, GET_TIMEOUT_MS);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream error";
    const isTimeout = /abort|timeout/i.test(msg);
    return NextResponse.json({ error: msg }, { status: isTimeout ? 504 : 502 });
  }

  let rows: unknown[];
  try {
    rows = await runPipeline(responseBody, feed.steps, { feedUrl: feed.url, headers, deadline });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Step error";
    return NextResponse.json({ error: msg }, { status: /too long/.test(msg) ? 504 : 422 });
  }

  // Only what the display reads leaves the server.
  const paths = usedPaths(feed);
  return NextResponse.json({ data: rows.slice(0, MAX_ROWS).map((row) => pickPaths(row, paths)) });
}
