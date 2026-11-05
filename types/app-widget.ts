export type LogoView = "icon" | "none" | "full";

export interface AppWidgetConfig {
  title: string;
  subtitle?: string;
  description?: string;
  logoUrl?: string;
  logoView?: LogoView;    // default "icon"
  url: string;
  tooltip?: string;
  clickable?: boolean;    // default true
  ping: boolean;
  pingUrl?: string;       // defaults to url when empty
  pingInterval: number;   // seconds, 10–300
  showLastPing?: boolean; // default false
  cardWidth?: number;     // px, default 256
  cardHeight?: number;    // px, default 64
}

export const DEFAULT_APP_WIDGET: AppWidgetConfig = {
  title: "My App",
  subtitle: "",
  description: "",
  logoUrl: "",
  logoView: "icon",
  url: "",
  tooltip: "",
  clickable: true,
  ping: false,
  pingUrl: "",
  pingInterval: 30,
  showLastPing: false,
  cardWidth: 256,
  cardHeight: 64,
};
