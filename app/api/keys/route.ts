import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readKeys } from "@/lib/auth/keys";

export async function GET() {
  const session = await getSession();
  if (!session.loggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const keyNames = Object.keys(readKeys());
  return NextResponse.json({ keyNames });
}
