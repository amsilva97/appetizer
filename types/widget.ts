import type { AppWidgetConfig } from "./app-widget";
import type { GroupWidgetConfig } from "./group-widget";
import type { LayoutWidgetConfig } from "./layout-widget";

export interface WidgetInstance {
  id: string;
  type: "app" | "layout" | "group";
  config: AppWidgetConfig | LayoutWidgetConfig | GroupWidgetConfig;
  x: number;
  y: number;
  parentId?: string;
  cellIndex?: number;
}
