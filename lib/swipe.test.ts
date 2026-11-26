import { describe, expect, test } from "vitest";
import { classifySwipe, insideSidewaysScroller, neighbourPage } from "./swipe";

const W = 400;

describe("classifySwipe", () => {
  test("a long swipe to the left goes to the next page", () => {
    expect(classifySwipe({ x: 300, y: 200 }, { x: 150, y: 210 }, W)).toBe("next");
  });

  test("a long swipe to the right goes to the previous page", () => {
    expect(classifySwipe({ x: 100, y: 200 }, { x: 250, y: 190 }, W)).toBe("prev");
  });

  test("ignores short swipes", () => {
    expect(classifySwipe({ x: 200, y: 200 }, { x: 150, y: 200 }, W)).toBeNull();
  });

  test("ignores mostly up-and-down movement, so scrolling the list doesn't change page", () => {
    expect(classifySwipe({ x: 200, y: 400 }, { x: 120, y: 200 }, W)).toBeNull();
  });

  test("leaves touches that start at either edge to the phone's back gesture", () => {
    expect(classifySwipe({ x: 10, y: 200 }, { x: 250, y: 200 }, W)).toBeNull();
    expect(classifySwipe({ x: 392, y: 200 }, { x: 150, y: 200 }, W)).toBeNull();
  });
});

describe("neighbourPage", () => {
  const pages = ["home", "media", "admin"];

  test("steps forward and back", () => {
    expect(neighbourPage(pages, "media", "next")).toBe("admin");
    expect(neighbourPage(pages, "media", "prev")).toBe("home");
  });

  test("stops at either end instead of wrapping", () => {
    expect(neighbourPage(pages, "admin", "next")).toBeNull();
    expect(neighbourPage(pages, "home", "prev")).toBeNull();
  });

  test("a page that isn't in the list goes to the first one", () => {
    expect(neighbourPage(pages, "gone", "next")).toBe("home");
    expect(neighbourPage([], "gone", "next")).toBeNull();
  });
});

describe("insideSidewaysScroller", () => {
  function box(overflowX: string, scrollWidth: number, clientWidth: number): HTMLElement {
    const el = document.createElement("div");
    el.style.overflowX = overflowX;
    Object.defineProperty(el, "scrollWidth", { value: scrollWidth });
    Object.defineProperty(el, "clientWidth", { value: clientWidth });
    return el;
  }

  test("finds a scrolling parent between the touch and the stop element", () => {
    const root = box("visible", 400, 400);
    const table = box("auto", 900, 400);
    const cell = box("visible", 100, 100);
    root.appendChild(table);
    table.appendChild(cell);
    expect(insideSidewaysScroller(cell, root)).toBe(true);
  });

  test("ignores content that fits, and boxes that clip instead of scrolling", () => {
    const root = box("visible", 400, 400);
    const fits = box("auto", 400, 400);
    const clipped = box("hidden", 900, 400);
    root.appendChild(fits);
    fits.appendChild(clipped);
    expect(insideSidewaysScroller(clipped, root)).toBe(false);
  });
});
