/**
 * Which edges fade. "auto" follows the widget: a menu fades along the way it
 * scrolls, a layout fades on every edge.
 */
export type EdgeShadowEdges = "auto" | "horizontal" | "vertical" | "all";

export interface EdgeShadowConfig {
  enabled: boolean;
  edges: EdgeShadowEdges;
  /** Depth of the fade, in px. */
  size: number;
  color: string;
  /** 0–100 at the very edge; it fades to nothing at `size`. */
  opacity: number;
}

export const DEFAULT_EDGE_SHADOW: EdgeShadowConfig = {
  enabled: false,
  edges: "auto",
  size: 48,
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
