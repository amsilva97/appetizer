export interface AppWidgetConfig {
  title: string;
  subtitle?: string;
  description?: string;
  logoUrl?: string;
  url: string;
  tooltip?: string;
  ping: boolean;
  pingUrl?: string;      // defaults to url when empty
  pingInterval: number;  // seconds, 10–300
}

export const DEFAULT_APP_WIDGET: AppWidgetConfig = {
  title: "My App",
  subtitle: "",
  description: "",
  logoUrl: "",
  url: "",
  tooltip: "",
  ping: false,
  pingUrl: "",
  pingInterval: 30,
};
