import { resolveSpacing, type Spacing, type SpacingValue } from "./spacing";
import type { AppFeedConfig } from "./feed";

export type LogoView = "icon" | "none" | "full" | "compact";

export const LOGO_VIEWS: readonly LogoView[] = ["icon", "none", "full", "compact"];
export type CoverFit = "cover" | "contain";

export type { AppFeedConfig, FeedHeaderRow, FeedMethod } from "./feed";
export { DEFAULT_FEED_CONFIG } from "./feed";

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
