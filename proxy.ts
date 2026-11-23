import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { adminExists, findUser } from "@/lib/auth/users";
import { readSettings } from "@/lib/auth/settings";
import { type SessionData, getSessionOptions } from "@/lib/auth/session";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|setup|login|api|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$).*)"],
};

export async function proxy(request: NextRequest) {
  if (!adminExists()) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (!session.loggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Re-verify the account is still active. Which admin areas they can use
    // (role capabilities, IP allowlist) is checked by the admin layout and pages.
    const user = findUser(session.username ?? "");
    if (!user || user.disabled) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const { forceLogin } = readSettings();

  if (!session.loggedIn) {
    if (forceLogin) return NextResponse.redirect(new URL("/login", request.url));
    return response; // guest access
  }

  // Re-verify user is still active
  const user = findUser(session.username ?? "");
  if (!user || user.disabled) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
