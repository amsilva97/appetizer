// Minimal React DOM test helpers on plain react-dom + jsdom.
// The project's lockfile has no @testing-library/dom, so component tests
// avoid @testing-library/react and drive the DOM directly.
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { root: Root; container: HTMLElement }[] = [];

export interface Rendered {
  container: HTMLElement;
  rerender: (ui: ReactNode) => void;
}

export function render(ui: ReactNode): Rendered {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ root, container });
  act(() => root.render(ui));
  return { container, rerender: (next) => act(() => root.render(next)) };
}

/** Unmount everything rendered since the last cleanup. */
export function cleanup(): void {
  while (mounted.length) {
    const { root, container } = mounted.pop()!;
    act(() => root.unmount());
    container.remove();
  }
}

function dispatch(el: Element, event: Event): void {
  act(() => { el.dispatchEvent(event); });
}

export const fire = {
  click: (el: Element) => dispatch(el, new MouseEvent("click", { bubbles: true, cancelable: true })),
  keyDown: (el: Element, key: string) => dispatch(el, new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })),
  wheel: (el: Element, deltaY: number) => dispatch(el, new WheelEvent("wheel", { deltaY, bubbles: true })),
  pointer: (el: Element, type: "pointerdown" | "pointerup", clientX: number, clientY = 0) =>
    dispatch(el, new MouseEvent(type, { clientX, clientY, bubbles: true })),
  /** Set an input's value the way a user would, so React's onChange runs. */
  change: (el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    dispatch(el, new Event("input", { bubbles: true }));
  },
  /** Pick an option in a <select>, so React's onChange runs. */
  select: (el: HTMLSelectElement, value: string) => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(el, value);
    dispatch(el, new Event("change", { bubbles: true }));
  },
};

export function byLabel(root: ParentNode, label: string): HTMLElement | null {
  return root.querySelector(`[aria-label="${label}"]`);
}

/** First element whose own text is exactly `text`. */
export function byText(root: ParentNode, text: string | RegExp): HTMLElement | null {
  const all = Array.from(root.querySelectorAll<HTMLElement>("*"));
  return all.find((el) => {
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join("").trim();
    return typeof text === "string" ? own === text : text.test(own);
  }) ?? null;
}
