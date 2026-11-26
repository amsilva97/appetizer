"use client";

import { useRef, useState, type RefObject, type TouchEvent } from "react";
import { classifySwipe, insideSidewaysScroller, type Point, type SwipeDirection } from "@/lib/swipe";

/** How far the list follows the finger at most while pulling down. */
export const PULL_MAX_PX = 80;
/** Pull at least this far (after damping) and let go to refresh. */
export const PULL_TRIGGER_PX = 56;
/** Movement before a touch is treated as a swipe, a pull or a scroll. */
const DECIDE_PX = 10;
/** The list moves half as far as the finger, so the pull feels weighted. */
const PULL_DAMPING = 0.5;

type Mode = "undecided" | "swipe" | "pull" | "scroll";

interface Gesture {
  start: Point;
  mode: Mode;
  /** Started inside something that scrolls sideways, so a sideways move is that thing's, not a page change. */
  inSideways: boolean;
  /** The list was scrolled to the top, so pulling down can refresh. */
  atTop: boolean;
}

interface Options {
  scrollerRef: RefObject<HTMLElement | null>;
  onSwipe: (direction: SwipeDirection) => void;
  onRefresh: () => Promise<void>;
}

export interface PhoneGestures {
  /** How far the list is pulled down right now, in px. */
  pull: number;
  refreshing: boolean;
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
    onTouchCancel: () => void;
  };
}

const pointOf = (t: { clientX: number; clientY: number }): Point => ({ x: t.clientX, y: t.clientY });

/** Sideways swipes change page; pulling down from the top refreshes it. */
export function usePhoneGestures({ scrollerRef, onSwipe, onRefresh }: Options): PhoneGestures {
  const gesture = useRef<Gesture | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1 || refreshing) {
      gesture.current = null;
      return;
    }
    gesture.current = {
      start: pointOf(e.touches[0]),
      mode: "undecided",
      inSideways: insideSidewaysScroller(e.target as Element, e.currentTarget),
      atTop: (scrollerRef.current?.scrollTop ?? 0) <= 0,
    };
  }

  function onTouchMove(e: TouchEvent) {
    const g = gesture.current;
    if (!g || e.touches.length !== 1) return;
    const now = pointOf(e.touches[0]);
    const dx = now.x - g.start.x;
    const dy = now.y - g.start.y;

    if (g.mode === "undecided" && Math.max(Math.abs(dx), Math.abs(dy)) >= DECIDE_PX) {
      if (g.atTop && dy > 0 && dy > Math.abs(dx)) g.mode = "pull";
      else if (Math.abs(dx) > Math.abs(dy) && !g.inSideways) g.mode = "swipe";
      else g.mode = "scroll";
    }
    if (g.mode === "pull") setPull(Math.min(Math.max(dy, 0) * PULL_DAMPING, PULL_MAX_PX));
  }

  async function onTouchEnd(e: TouchEvent) {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;

    if (g.mode === "pull") {
      const shouldRefresh = pull >= PULL_TRIGGER_PX;
      setPull(0);
      if (!shouldRefresh) return;
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
      return;
    }

    if (g.mode !== "swipe") return;
    const end = e.changedTouches[0];
    if (!end) return;
    const direction = classifySwipe(g.start, pointOf(end), window.innerWidth);
    if (direction) onSwipe(direction);
  }

  function onTouchCancel() {
    gesture.current = null;
    setPull(0);
  }

  return { pull, refreshing, handlers: { onTouchStart, onTouchMove, onTouchEnd: (e) => void onTouchEnd(e), onTouchCancel } };
}
