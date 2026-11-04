import type { BackgroundConfig } from "@/types/background";

export const BACKGROUND_PRESETS: Record<string, BackgroundConfig> = {
  // Solid
  Midnight: { type: "solid", color: "#0a0a0a" },
  Snow: { type: "solid", color: "#f5f5f5" },
  // Gradient
  "Ocean Dusk": {
    type: "gradient",
    colors: ["#1a1a2e", "#16213e", "#0f3460"],
    direction: 160,
  },
  Sunrise: {
    type: "gradient",
    colors: ["#ff6b6b", "#feca57", "#48dbfb"],
    direction: 120,
    animated: true,
    speed: 5,
  },
  "Cotton Candy": {
    type: "gradient",
    colors: ["#f093fb", "#f5576c", "#4facfe"],
    direction: 135,
    animated: true,
    speed: 4,
  },
  // Wavy
  "Deep Sea": {
    type: "wavy",
    baseColor: "#0a192f",
    waveColor: "#172a45",
    speed: 4,
    amplitude: 40,
    layers: 3,
  },
  Lava: {
    type: "wavy",
    baseColor: "#1a0000",
    waveColor: "#4d0000",
    speed: 8,
    amplitude: 50,
    layers: 4,
  },
  // Aurora
  Nebula: {
    type: "aurora",
    baseColor: "#000814",
    colors: ["#48cae4", "#90e0ef", "#023e8a", "#7209b7"],
    speed: 3,
    blur: 90,
  },
  "Northern Lights": {
    type: "aurora",
    baseColor: "#0d0d0d",
    colors: ["#00f5d4", "#fee440", "#00bbf9"],
    speed: 4,
    blur: 80,
  },
  // Particles
  Web: {
    type: "particles",
    baseColor: "#0a0a0a",
    particleColor: "#4facfe",
    count: 60,
    speed: 3,
    size: 2,
    connected: true,
  },
  Cosmos: {
    type: "particles",
    baseColor: "#000000",
    particleColor: "#ffffff",
    count: 120,
    speed: 2,
    size: 1.5,
    connected: false,
  },
  // Mesh
  "Aurora Mesh": {
    type: "mesh",
    baseColor: "#050510",
    colors: ["#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0", "#f72585"],
    speed: 3,
  },
  Sherbet: {
    type: "mesh",
    baseColor: "#fff0f3",
    colors: ["#ffb3c1", "#ff8fa3", "#c77dff", "#90e0ef", "#ffd6a5"],
    speed: 2,
  },
  // Conic
  Prism: {
    type: "conic",
    colors: ["#ff0000", "#ff8800", "#ffff00", "#00ff00", "#0000ff", "#8800ff"],
    speed: 2,
    reverse: false,
  },
  Molten: {
    type: "conic",
    colors: ["#1a0000", "#7f0000", "#cc3300", "#ff6600", "#ffaa00", "#ff6600", "#cc3300", "#7f0000"],
    speed: 3,
    reverse: false,
  },
  // Plasma
  Acid: {
    type: "plasma",
    hueStart: 60,
    hueRange: 180,
    saturation: 1,
    speed: 7,
    scale: 20,
  },
  "Deep Space": {
    type: "plasma",
    hueStart: 200,
    hueRange: 100,
    saturation: 0.85,
    speed: 4,
    scale: 25,
  },
  // Bokeh
  "City Lights": {
    type: "bokeh",
    baseColor: "#0a0a0a",
    colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff"],
    count: 18,
    speed: 2,
    size: 180,
  },
  Candlelight: {
    type: "bokeh",
    baseColor: "#0d0500",
    colors: ["#ff4500", "#ff8c00", "#ffd700", "#ff6347"],
    count: 12,
    speed: 1,
    size: 220,
  },
  // Geometric
  Topography: {
    type: "geometric",
    baseColor: "#050d14",
    colors: ["#0d1b2a", "#1b2838", "#1f4068", "#1b6ca8", "#163a5f"],
    speed: 3,
    cellSize: 100,
  },
  Autumn: {
    type: "geometric",
    baseColor: "#0d0400",
    colors: ["#1a0a00", "#5c1a00", "#b34700", "#e06c00", "#c44b00"],
    speed: 4,
    cellSize: 80,
  },
};

export const DEFAULT_BY_TYPE: Record<BackgroundConfig["type"], BackgroundConfig> = {
  solid: { type: "solid", color: "#0a0a0a" },
  gradient: {
    type: "gradient",
    colors: ["#1a1a2e", "#0f3460"],
    direction: 160,
  },
  wavy: {
    type: "wavy",
    baseColor: "#0a192f",
    waveColor: "#172a45",
    speed: 4,
    amplitude: 40,
    layers: 3,
  },
  aurora: {
    type: "aurora",
    baseColor: "#000814",
    colors: ["#48cae4", "#023e8a", "#7209b7"],
    speed: 4,
    blur: 80,
  },
  particles: {
    type: "particles",
    baseColor: "#0a0a0a",
    particleColor: "#ffffff",
    count: 80,
    speed: 3,
    size: 2,
    connected: true,
  },
  mesh: {
    type: "mesh",
    baseColor: "#050510",
    colors: ["#7209b7", "#4361ee", "#4cc9f0", "#f72585"],
    speed: 3,
  },
  conic: {
    type: "conic",
    colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff"],
    speed: 3,
    reverse: false,
  },
  plasma: {
    type: "plasma",
    hueStart: 200,
    hueRange: 160,
    saturation: 0.9,
    speed: 5,
    scale: 15,
  },
  bokeh: {
    type: "bokeh",
    baseColor: "#0a0a0a",
    colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3"],
    count: 15,
    speed: 2,
    size: 150,
  },
  geometric: {
    type: "geometric",
    baseColor: "#050d14",
    colors: ["#0d1b2a", "#1f4068", "#1b6ca8", "#163a5f"],
    speed: 3,
    cellSize: 100,
  },
};
