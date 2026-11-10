export type MenuType = "list";
export type MenuDirection = "vertical" | "horizontal";

export interface MenuWidgetConfig {
  label: string;
  type: MenuType;
  direction: MenuDirection;
  margin: number;
  borderRadius: number;
  padding: number;
  gap: number;
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderOpacity: number;
}

export const DEFAULT_MENU_WIDGET: MenuWidgetConfig = {
  label: "Menu",
  type: "list",
  direction: "vertical",
  margin: 0,
  borderRadius: 8,
  padding: 12,
  gap: 8,
  bgColor: "#ffffff",
  bgOpacity: 5,
  borderColor: "#ffffff",
  borderOpacity: 10,
};
