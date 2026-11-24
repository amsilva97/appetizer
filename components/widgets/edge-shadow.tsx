"use client";

import { toRgba } from "@/lib/color";
import { edgeShadowStops, type EdgeShadowConfig, type EdgeSides } from "@/types/edge-shadow";

interface Props {
  config: EdgeShadowConfig;
  sides: EdgeSides;
}

const DIRECTION: Record<keyof EdgeSides, string> = {
  top: "to bottom",
  right: "to left",
  bottom: "to top",
  left: "to right",
};

const PLACEMENT: Record<keyof EdgeSides, React.CSSProperties> = {
  top: { top: 0, left: 0, right: 0 },
  right: { top: 0, right: 0, bottom: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
  left: { top: 0, left: 0, bottom: 0 },
};

/**
 * Soft inner fade along a container's edges, so content looks like it slides
 * behind a shadow instead of being cut off. Sits over the content and lets
 * clicks through.
 */
export default function EdgeShadow({ config, sides }: Props) {
  if (!config.enabled || config.size <= 0) return null;
  const solid = toRgba(config.color, config.opacity);
  const clear = toRgba(config.color, 0);

  return (
    <>
      {(Object.keys(DIRECTION) as (keyof EdgeSides)[]).map((side) => {
        if (!sides[side]) return null;
        const vertical = side === "top" || side === "bottom";
        return (
          <div
            key={side}
            aria-hidden
            data-edge-shadow={side}
            className="absolute pointer-events-none z-[5]"
            style={{
              ...PLACEMENT[side],
              [vertical ? "height" : "width"]: config.size,
              background: `linear-gradient(${DIRECTION[side]}, ${edgeShadowStops(config, solid, clear)})`,
            }}
          />
        );
      })}
    </>
  );
}
