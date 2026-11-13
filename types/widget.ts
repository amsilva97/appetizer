import type { AppWidgetConfig } from "./app-widget";
import type { MenuWidgetConfig } from "./menu-widget";
import type { LayoutWidgetConfig } from "./layout-widget";

export interface WidgetInstance {
  id: string;
  type: "app" | "layout" | "menu";
  config: AppWidgetConfig | LayoutWidgetConfig | MenuWidgetConfig;
  x: number;
  y: number;
  parentId?: string;
  cellIndex?: number;
  permissions?: string[];
}
