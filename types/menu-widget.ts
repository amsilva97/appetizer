import type { SpacingValue } from "./spacing";
import type { EdgeShadowConfig } from "./edge-shadow";

export type MenuType = "list" | "carousel";
export type MenuDirection = "vertical" | "horizontal";

export interface MenuWidgetConfig {
  label: string;
  /** Draw the label as a heading above the apps. Missing means shown. */
  showLabel?: boolean;
  type: MenuType;
  direction: MenuDirection;
  /** Carousel: how many apps show at once. */
  visibleCount?: number;
  /** Carousel: wrap around from the last app back to the first. */
  infinite?: boolean;
  margin: SpacingValue;
  borderRadius: number;
  padding: SpacingValue;
  gap: number;
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderOpacity: number;
  edgeShadow?: EdgeShadowConfig;
}

export const DEFAULT_VISIBLE_COUNT = 3;

export const DEFAULT_MENU_WIDGET: MenuWidgetConfig = {
  label: "Menu",
  type: "list",
  direction: "vertical",
  visibleCount: DEFAULT_VISIBLE_COUNT,
  infinite: false,
  margin: 0,
  borderRadius: 8,
  padding: 12,
  gap: 8,
  bgColor: "#ffffff",
  bgOpacity: 5,
  borderColor: "#ffffff",
  borderOpacity: 10,
};
