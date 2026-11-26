import type { LogoView } from "./app-widget";

/** How much of a phone row a card takes. */
export type MobileSpan = "full" | "half" | "third";

/** One card on a page's phone version. */
export interface MobileSlot {
  id: string; // app widget id from the same page
  span: MobileSpan;
  /** Logo view on the phone only; missing means the card's own logo view. */
  logoView?: LogoView;
}

/** A page's phone version: the page's own app cards, filled into rows top to bottom. */
export interface MobileConfig {
  slots: MobileSlot[];
}
