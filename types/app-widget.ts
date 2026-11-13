export type LogoView = "icon" | "none" | "full";
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
  padding: number;
  margin: number;
  borderRadius: number;
  iconZoom: number;
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
  padding: 16,
  margin: 0,
  borderRadius: 16,
  iconZoom: 1,
  iconOffsetX: 0,
  iconOffsetY: 0,
};
