export interface ToolbarStyle {
  bgColor?: string;
  activeTabColor?: string;
  tabColor?: string;
  height?: number;
  tabRadius?: number;
  gap?: number;
  blur?: number;
  tabVariant?: "pill" | "underline";
  buttonBg?: string;
  buttonBorderColor?: string;
  buttonIconColor?: string;
}

export const TOOLBAR_DEFAULTS = {
  bgColor: "rgba(24, 24, 27, 0.8)",
  activeTabColor: "#00aaff",
  tabColor: "#71717a",
  height: 48,
  tabRadius: 8,
  gap: 4,
  blur: 12,
  tabVariant: "pill" as const,
  buttonBg: "transparent",
  buttonBorderColor: "rgba(255,255,255,0.08)",
  buttonIconColor: "#71717a",
} as const;
