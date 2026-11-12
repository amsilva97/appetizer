import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session.loggedIn) {
    return NextResponse.json({ loggedIn: false, username: null, role: null });
  }
  return NextResponse.json({
    loggedIn: true,
    username: session.username,
    role: session.role,
  });
}
