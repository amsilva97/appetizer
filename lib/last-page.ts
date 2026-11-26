const KEY = "appetizer:last-page";

/** The page this browser was last on, if storage is available and holds one. */
export function readLastPage(): string | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value || null;
  } catch {
    return null; // storage blocked (private mode, site data off)
  }
}

/** Remember the page for next time; quietly does nothing when storage is unavailable. */
export function saveLastPage(name: string): void {
  if (!name) return;
  try {
    window.localStorage.setItem(KEY, name);
  } catch {
    // storage blocked: the next visit just opens the default page
  }
}
