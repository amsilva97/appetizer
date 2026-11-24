/** Per-side spacing in px, in CSS order. */
export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * What's stored in a widget config. Older pages saved one number for all four
 * sides, so a plain number is still read as "every side".
 */
export type SpacingValue = number | Spacing;

export const SPACING_SIDES = ["top", "right", "bottom", "left"] as const;
export type SpacingSide = (typeof SPACING_SIDES)[number];

export function uniformSpacing(n: number): Spacing {
  return { top: n, right: n, bottom: n, left: n };
}

function sideOf(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Turn a saved value (number, object, or missing) into four sides. */
export function resolveSpacing(value: SpacingValue | undefined | null, fallback = 0): Spacing {
  if (typeof value === "number" && Number.isFinite(value)) return uniformSpacing(value);
  if (value && typeof value === "object") {
    return {
      top: sideOf(value.top, fallback),
      right: sideOf(value.right, fallback),
      bottom: sideOf(value.bottom, fallback),
      left: sideOf(value.left, fallback),
    };
  }
  return uniformSpacing(fallback);
}

/** CSS shorthand, e.g. "4px 8px 4px 8px". */
export function spacingCss(s: Spacing): string {
  return `${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`;
}

export function isUniform(s: Spacing): boolean {
  return s.top === s.right && s.right === s.bottom && s.bottom === s.left;
}
