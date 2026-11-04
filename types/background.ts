interface WithOverlays {
  grain?: number; // 0–0.5
  vignette?: number; // 0–1
}

export interface SolidConfig extends WithOverlays {
  type: "solid";
  color: string;
}

export interface GradientConfig extends WithOverlays {
  type: "gradient";
  colors: string[];
  direction: number;
  animated?: boolean;
  speed?: number; // 1–10, used when animated
}

export interface WavyConfig extends WithOverlays {
  type: "wavy";
  baseColor: string;
  waveColor: string;
  speed: number; // 1–10
  amplitude: number; // 10–100 px
  layers: number; // 2–5
}

export interface AuroraConfig extends WithOverlays {
  type: "aurora";
  baseColor: string;
  colors: string[]; // 2–5 blob colors
  speed: number; // 1–10
  blur: number; // 40–120 px
}

export interface ParticlesConfig extends WithOverlays {
  type: "particles";
  baseColor: string;
  particleColor: string;
  count: number; // 10–200
  speed: number; // 1–10
  size: number; // 1–5
  connected: boolean;
}

export interface MeshConfig extends WithOverlays {
  type: "mesh";
  baseColor: string;
  colors: string[]; // 3–6 node colors
  speed: number; // 1–10
}

export interface ConicConfig extends WithOverlays {
  type: "conic";
  colors: string[]; // 2–6
  speed: number; // 1–10
  reverse: boolean;
}

export interface PlasmaConfig extends WithOverlays {
  type: "plasma";
  hueStart: number; // 0–360
  hueRange: number; // 30–360
  saturation: number; // 0.5–1
  speed: number; // 1–10
  scale: number; // 5–30
}

export interface BokehConfig extends WithOverlays {
  type: "bokeh";
  baseColor: string;
  colors: string[]; // 2–6
  count: number; // 5–25
  speed: number; // 1–10
  size: number; // 50–300 max radius px
}

export interface GeometricConfig extends WithOverlays {
  type: "geometric";
  baseColor: string;
  colors: string[]; // 2–5 triangle palette
  speed: number; // 1–10
  cellSize: number; // 50–200 px
}

export type BackgroundConfig =
  | SolidConfig
  | GradientConfig
  | WavyConfig
  | AuroraConfig
  | ParticlesConfig
  | MeshConfig
  | ConicConfig
  | PlasmaConfig
  | BokehConfig
  | GeometricConfig;
