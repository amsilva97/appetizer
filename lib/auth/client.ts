/** Name shown on the profile button for anyone who isn't signed in. */
export const GUEST_NAME = "Guest";

/** Where the browser goes after signing out: the homepage, as a fresh load. */
export const AFTER_SIGN_OUT_PATH = "/";
export const SIGN_IN_PATH = "/login";

/**
 * Sign out, then load the homepage again. The proxy sends the reload on to the
 * sign-in page when guest viewing is off; otherwise you see the guest view.
 * Reloads even if the request fails, so the screen never shows a stale user.
 */
export async function signOut(go: (path: string) => void = (p) => window.location.replace(p)): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    go(AFTER_SIGN_OUT_PATH);
  }
}

/**
 * A 401 from the page API means guest viewing is off and this visitor isn't
 * signed in (never signed in, signed out elsewhere, or the session expired).
 * Returns true when it sent the browser to the sign-in page.
 */
export function redirectIfSignInRequired(
  res: Response,
  go: (path: string) => void = (p) => window.location.replace(p)
): boolean {
  if (res.status !== 401) return false;
  go(SIGN_IN_PATH);
  return true;
}
