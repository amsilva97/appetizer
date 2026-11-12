export type FeedMethod = "none" | "GET";

export interface FeedHeaderRow {
  key: string;
  value: string;
}

export interface FeedConnection {
  method: FeedMethod;
  url: string;
  headers: FeedHeaderRow[];
  transform: string;
}

export interface FeedWidgetConfig {
  label: string;
  connection: FeedConnection;
  pollInterval: number;
  width: number;
  height: number;
  borderRadius: number;
}

export const DEFAULT_FEED_CONNECTION: FeedConnection = {
  method: "none",
  url: "",
  headers: [],
  transform: "",
};

export const DEFAULT_FEED_WIDGET: FeedWidgetConfig = {
  label: "Feed",
  connection: DEFAULT_FEED_CONNECTION,
  pollInterval: 30,
  width: 320,
  height: 240,
  borderRadius: 16,
};
