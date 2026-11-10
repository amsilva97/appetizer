import type { AppWidgetConfig } from "./app-widget";
import type { LayoutWidgetConfig } from "./layout-widget";

export interface WidgetInstance {
  id: string;
  type: "app" | "layout";
  config: AppWidgetConfig | LayoutWidgetConfig;
  x: number;
  y: number;
  parentId?: string;
  cellIndex?: number;
}
