import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { readKeys } from "@/lib/auth/keys";
import { substituteHeaders, fetchFeed, runTransform } from "@/lib/feed/runner";
import { findSavedFeed } from "@/lib/feed/resolve";

interface RunRequest {
  /** Page and widget the feed belongs to. Required for non-admins. */
  page?: string;
  widgetId?: string;
  /** Live config. Honoured only for admins, who preview unsaved widgets. */
  url?: string;
  headers?: Record<string, string>;
  transform?: string;
}

interface FeedJob {
  url: string;
  headers: Record<string, string>;
  transform?: string;
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
 * Admins can run any feed config they send. Everyone else can only run the
 * feed saved on a widget they can see; anything else in the request is ignored.
 * Without this, any logged-in user could make the server fetch arbitrary URLs
 * and run arbitrary transform code.
 */
async function resolveJob(body: RunRequest): Promise<FeedJob | NextResponse> {
  const viewer = await getViewer();
  if (!viewer.loggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (viewer.isAdmin && typeof body.url === "string") {
    return { url: body.url, headers: body.headers ?? {}, transform: body.transform };
  }

  if (typeof body.page !== "string" || typeof body.widgetId !== "string") {
    return NextResponse.json({ error: "page and widgetId required" }, { status: 400 });
  }
  const feed = findSavedFeed(body.page, body.widgetId, viewer.permissions, viewer.isAdmin);
  if (!feed) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }
  return {
    url: feed.url,
    headers: Object.fromEntries(
      (feed.headers ?? []).filter((h) => h.key.trim()).map((h) => [h.key, h.value])
    ),
    transform: feed.transform || undefined,
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
  const { url, headers, transform } = job;

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid or missing URL" }, { status: 400 });
  }
  if (typeof transform === "string" && transform.length > MAX_TRANSFORM_CHARS) {
    return NextResponse.json({ error: `Transform too long (max ${MAX_TRANSFORM_CHARS} chars)` }, { status: 400 });
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

  let result: unknown;
  try {
    result = runTransform(responseBody, transform);
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
