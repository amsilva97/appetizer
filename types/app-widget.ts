import { resolveSpacing, type Spacing, type SpacingValue } from "./spacing";

export type LogoView = "icon" | "none" | "full";
export type CoverFit = "cover" | "contain";
export type FeedMethod = "none" | "GET";

export interface FeedHeaderRow {
  key: string;
  value: string;
}

export interface AppFeedConfig {
  method: FeedMethod;
  url: string;
  headers: FeedHeaderRow[];
  transform: string;
  /**
   * Optional JS expression receiving `body` that returns follow-up URLs (paths
   * or absolute URLs on the feed's host). Their parsed responses reach the
   * transform as `lookups`, in order, with null for any that failed.
   */
  lookups?: string;
  pollInterval: number;
  height: number;
}

export const DEFAULT_FEED_CONFIG: AppFeedConfig = {
  method: "none",
  url: "",
  headers: [],
  transform: "",
  pollInterval: 30,
  height: 200,
};

export interface AppWidgetConfig {
  title: string;
  subtitle?: string;
  tooltip?: string;
  logoUrl?: string;
  logoView: LogoView;
  url: string;
  openUrl: boolean;
  ping: boolean;
  pingUrl?: string;
  pingInterval: number; // seconds
  width: number;
  height: number;
  /** A legacy plain number pads only the left and right of the header row. */
  padding: SpacingValue;
  margin: SpacingValue;
  borderRadius: number;
  iconZoom: number;
  /**
   * Full cover only. "cover" fills the card and crops; "contain" shows the whole
   * image over a blurred copy of itself. Missing means "cover".
   */
  coverFit?: CoverFit;
  iconOffsetX: number;
  iconOffsetY: number;
  feed?: AppFeedConfig;
}

export const DEFAULT_APP_WIDGET: AppWidgetConfig = {
  title: "My App",
  subtitle: "",
  tooltip: "",
  logoUrl: "",
  logoView: "icon",
  url: "",
  openUrl: true,
  ping: false,
  pingUrl: "",
  pingInterval: 30,
  width: 240,
  height: 72,
  padding: { top: 0, right: 16, bottom: 0, left: 16 },
  margin: 0,
  borderRadius: 16,
  iconZoom: 1,
  iconOffsetX: 0,
  iconOffsetY: 0,
};

/**
 * App padding as four sides. A legacy plain number only ever padded the left
 * and right of the header row, so it keeps doing just that.
 */
export function resolveAppPadding(value: SpacingValue | undefined): Spacing {
  if (typeof value === "number") return { top: 0, right: value, bottom: 0, left: value };
  return resolveSpacing(value, 16);
}
