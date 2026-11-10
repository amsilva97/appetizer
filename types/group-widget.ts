export type GroupDirection = "vertical" | "horizontal";

export interface GroupWidgetConfig {
  label: string;
  direction: GroupDirection;
  borderRadius: number;
  padding: number;
  gap: number;
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderOpacity: number;
}

export const DEFAULT_GROUP_WIDGET: GroupWidgetConfig = {
  label: "Group",
  direction: "vertical",
  borderRadius: 8,
  padding: 12,
  gap: 8,
  bgColor: "#ffffff",
  bgOpacity: 5,
  borderColor: "#ffffff",
  borderOpacity: 10,
};
