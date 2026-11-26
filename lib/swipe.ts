/** Touches that start this close to a side are left to the phone's own back gesture. */
export const SWIPE_EDGE_PX = 20;
/** How far sideways a finger has to travel to count as a swipe. */
export const SWIPE_MIN_PX = 60;
/** Sideways travel has to beat up-and-down travel by this much, so scrolling the list isn't a swipe. */
export const SWIPE_RATIO = 1.5;

export interface Point {
  x: number;
  y: number;
}

/** "next" for a swipe to the left, "prev" for a swipe to the right, null for anything else. */
export type SwipeDirection = "next" | "prev";

export function classifySwipe(start: Point, end: Point, viewportWidth: number): SwipeDirection | null {
  if (start.x < SWIPE_EDGE_PX || start.x > viewportWidth - SWIPE_EDGE_PX) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < SWIPE_MIN_PX) return null;
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return null;
  return dx < 0 ? "next" : "prev";
}

/** The page a swipe lands on, or null at either end of the list. */
export function neighbourPage(pages: string[], current: string, direction: SwipeDirection): string | null {
  const i = pages.indexOf(current);
  if (i === -1) return pages[0] ?? null;
  const j = direction === "next" ? i + 1 : i - 1;
  return pages[j] ?? null;
}

/** Whether `el` or anything between it and `stop` scrolls sideways, so a swipe there belongs to it. */
export function insideSidewaysScroller(el: Element | null, stop: Element | null): boolean {
  for (let node = el; node && node !== stop; node = node.parentElement) {
    if (node.scrollWidth <= node.clientWidth) continue;
    const overflowX = getComputedStyle(node).overflowX;
    if (overflowX === "auto" || overflowX === "scroll") return true;
  }
  return false;
}
