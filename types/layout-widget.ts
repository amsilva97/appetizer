import type { SpacingValue } from "./spacing";
import type { EdgeShadowConfig } from "./edge-shadow";

export type LayoutType = "grid" | "gutters";

/**
 * Horizontal gutters sit left and right of the main area; vertical gutters sit
 * above and below it.
 */
export type GutterOrientation = "horizontal" | "vertical";

/** "start" is the left (or top) gutter, "end" the right (or bottom) one. */
export type GutterSides = "start" | "end" | "both";

export type GutterSizeMode = "px" | "%" | "min-content";

export interface GutterSize {
  mode: GutterSizeMode;
  /** Ignored for min-content. */
  value: number;
}

export interface LayoutWidgetLayout {
  type: LayoutType;
  // grid
  columns: number;
  rows: number;
  // gutters
  orientation?: GutterOrientation;
  gutters?: GutterSides;
  startSize?: GutterSize;
  endSize?: GutterSize;
}

export interface LayoutWidgetConfig {
  label: string;
  layout: LayoutWidgetLayout;
  padding: SpacingValue;
  gap: number;
  margin: SpacingValue;
  borderRadius: number;
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderOpacity: number;
  edgeShadow?: EdgeShadowConfig;
}

export const DEFAULT_GUTTER_SIZE: GutterSize = { mode: "px", value: 240 };

export const DEFAULT_LAYOUT_WIDGET: LayoutWidgetConfig = {
  label: "Layout",
  layout: {
    type: "grid",
    columns: 3,
    rows: 2,
  },
  padding: 0,
  gap: 0,
  margin: 0,
  borderRadius: 0,
  bgColor: "#ffffff",
  bgOpacity: 3,
  borderColor: "#ffffff",
  borderOpacity: 6,
};
