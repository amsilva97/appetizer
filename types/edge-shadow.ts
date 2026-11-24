/**
 * Which edges fade. "auto" follows the widget: a menu fades along the way it
 * scrolls, a layout fades on every edge.
 */
export type EdgeShadowEdges = "auto" | "horizontal" | "vertical" | "all";

export interface EdgeShadowConfig {
  enabled: boolean;
  edges: EdgeShadowEdges;
  /** Distance from the edge where the shadow has fully faded out, in px. */
  size: number;
  /**
   * Distance from the edge the shadow stays at full strength before it starts
   * to fade, in px. 0 starts fading right at the edge.
   */
  solidSize?: number;
  color: string;
  /** 0–100 at the very edge; it fades to nothing at `size`. */
  opacity: number;
}

export const DEFAULT_EDGE_SHADOW: EdgeShadowConfig = {
  enabled: false,
  edges: "auto",
  size: 48,
  solidSize: 0,
  color: "#000000",
  opacity: 80,
};

export interface EdgeSides {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

/** `autoAxis` is what "auto" means for this widget. */
export function resolveEdgeSides(
  edges: EdgeShadowEdges,
  autoAxis: "horizontal" | "vertical" | "all"
): EdgeSides {
  const axis = edges === "auto" ? autoAxis : edges;
  const h = axis === "horizontal" || axis === "all";
  const v = axis === "vertical" || axis === "all";
  return { top: v, right: h, bottom: v, left: h };
}

export function resolveEdgeShadow(value: Partial<EdgeShadowConfig> | undefined): EdgeShadowConfig {
  return { ...DEFAULT_EDGE_SHADOW, ...(value ?? {}) };
}

/**
 * CSS color stops from the edge inwards: full strength up to `solidSize`, then
 * a fade to clear at `size`. A full-strength depth past the fade-out depth is
 * capped there (a hard band with no fade).
 */
export function edgeShadowStops(shadow: EdgeShadowConfig, solid: string, clear: string): string {
  const end = Math.max(0, shadow.size);
  const start = Math.min(end, Math.max(0, shadow.solidSize ?? 0));
  return `${solid} 0px, ${solid} ${start}px, ${clear} ${end}px`;
}
