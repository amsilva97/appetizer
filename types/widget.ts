import type { AppWidgetConfig } from "./app-widget";
import type { MenuWidgetConfig } from "./menu-widget";
import type { LayoutWidgetConfig } from "./layout-widget";
import type { FeedWidgetConfig } from "./feed-widget";

export interface WidgetInstance {
  id: string;
  type: "app" | "layout" | "menu" | "feed";
  config: AppWidgetConfig | LayoutWidgetConfig | MenuWidgetConfig | FeedWidgetConfig;
  x: number;
  y: number;
  parentId?: string;
  cellIndex?: number;
}
