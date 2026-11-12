import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readKeys } from "@/lib/auth/keys";
import { substituteHeaders, fetchFeed, runTransform } from "@/lib/feed/runner";

interface RunRequest {
  url: string;
  headers?: Record<string, string>;
  transform?: string;
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.loggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url, headers = {}, transform } = body as RunRequest;

  if (typeof url !== "string" || !isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid or missing URL" }, { status: 400 });
  }
  if (typeof transform === "string" && transform.length > 4096) {
    return NextResponse.json({ error: "Transform too long (max 4096 chars)" }, { status: 400 });
  }

  const keys = readKeys();
  const resolvedHeaders = substituteHeaders(headers, keys);

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

  if (!Array.isArray(result)) {
    return NextResponse.json(
      { error: "Transform must return an array" },
      { status: 422 }
    );
  }

  return NextResponse.json({ data: result });
}
