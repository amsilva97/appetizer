export type LogoView = "icon" | "none" | "full";

export interface AppWidgetConfig {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  logoView: LogoView;
  url: string;
  openUrl: boolean;
  ping: boolean;
  pingUrl?: string;
  pingInterval: number; // seconds
  width: number;
  height: number;
}

export const DEFAULT_APP_WIDGET: AppWidgetConfig = {
  title: "My App",
  subtitle: "",
  logoUrl: "",
  logoView: "icon",
  url: "",
  openUrl: true,
  ping: false,
  pingUrl: "",
  pingInterval: 30,
  width: 240,
  height: 72,
};
