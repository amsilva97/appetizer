export interface ToolbarStyle {
  bgColor?: string;
  activeTabColor?: string;
  tabColor?: string;
}

export const TOOLBAR_DEFAULTS = {
  bgColor: "rgba(24, 24, 27, 0.8)",
  activeTabColor: "#00aaff",
  tabColor: "#71717a",
} as const;
