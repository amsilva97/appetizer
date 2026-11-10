export type LayoutType = "grid";

export interface LayoutWidgetLayout {
  type: LayoutType;
  columns: number;
  rows: number;
}

export interface LayoutWidgetConfig {
  label: string;
  layout: LayoutWidgetLayout;
  padding: number;
  gap: number;
  margin: number;
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderOpacity: number;
}

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
  bgColor: "#ffffff",
  bgOpacity: 3,
  borderColor: "#ffffff",
  borderOpacity: 6,
};
