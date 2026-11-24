import { DEFAULT_APP_WIDGET, type AppWidgetConfig } from "@/types/app-widget";
import { DEFAULT_LAYOUT_WIDGET, type LayoutWidgetConfig } from "@/types/layout-widget";
import { DEFAULT_MENU_WIDGET, type MenuWidgetConfig } from "@/types/menu-widget";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Configs typed into the YAML tab go straight onto the canvas as a live
 * preview, so half-typed input has to become something that renders.
 * Returns null for anything that isn't an object at all.
 */
export function normalizeLayoutConfig(value: unknown): LayoutWidgetConfig | null {
  if (!isRecord(value)) return null;
  const layout = isRecord(value.layout) ? value.layout : {};
  return {
    ...DEFAULT_LAYOUT_WIDGET,
    ...value,
    layout: { ...DEFAULT_LAYOUT_WIDGET.layout, ...layout },
  } as LayoutWidgetConfig;
}

export function normalizeMenuConfig(value: unknown): MenuWidgetConfig | null {
  if (!isRecord(value)) return null;
  return { ...DEFAULT_MENU_WIDGET, ...value } as MenuWidgetConfig;
}

export function normalizeAppConfig(value: unknown): AppWidgetConfig | null {
  if (!isRecord(value)) return null;
  return { ...DEFAULT_APP_WIDGET, ...value } as AppWidgetConfig;
}
