import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * End the session. Answers with JSON rather than a redirect: the client calls
 * this with fetch, and a redirect (to an absolute URL that may not match the
 * site's own address) made that fetch fail before the page could reload.
 */
export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
