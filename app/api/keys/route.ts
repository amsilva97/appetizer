import { NextResponse } from "next/server";
import { guard } from "@/lib/auth/guard";
import { readKeys } from "@/lib/auth/keys";

/** Key names (never values), for the feed header picker. */
export async function GET() {
  const viewer = await guard("keys:read");
  if (viewer instanceof NextResponse) return viewer;
  return NextResponse.json({ keyNames: Object.keys(readKeys()) });
}
