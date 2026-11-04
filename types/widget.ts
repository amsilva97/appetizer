import type { AppWidgetConfig } from "./app-widget";

export interface WidgetInstance {
  id: string;
  type: "app";
  config: AppWidgetConfig;
  x: number;
  y: number;
}
