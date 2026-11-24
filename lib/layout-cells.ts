import {
  DEFAULT_GUTTER_SIZE,
  type GutterSize,
  type LayoutWidgetLayout,
} from "@/types/layout-widget";

/** Gutter layouts keep fixed cell numbers so children stay put when a gutter is switched off. */
export const GUTTER_START_CELL = 0;
export const GUTTER_MAIN_CELL = 1;
export const GUTTER_END_CELL = 2;

const MAX_GRID = 12;

export interface LayoutCell {
  /** What a child's `cellIndex` refers to. */
  index: number;
  /** Set when the cell sizes to its content along this axis. */
  fit?: "width" | "height";
}

export interface LayoutGeometry {
  gridTemplateColumns: string;
  gridTemplateRows: string;
  cells: LayoutCell[];
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

function resolveGutterSize(size: Partial<GutterSize> | undefined): GutterSize {
  const mode = size?.mode === "%" || size?.mode === "min-content" ? size.mode : "px";
  const value = typeof size?.value === "number" && Number.isFinite(size.value) && size.value >= 0
    ? size.value
    : mode === "%" ? 20 : DEFAULT_GUTTER_SIZE.value;
  return { mode, value: mode === "%" ? Math.min(100, value) : value };
}

/** Fill in anything an older or hand-written config left out. */
export function resolveLayout(layout: Partial<LayoutWidgetLayout> | undefined): LayoutWidgetLayout {
  const type = layout?.type === "gutters" ? "gutters" : "grid";
  return {
    type,
    columns: clampInt(layout?.columns, 1, MAX_GRID, 3),
    rows: clampInt(layout?.rows, 1, MAX_GRID, 2),
    orientation: layout?.orientation === "vertical" ? "vertical" : "horizontal",
    gutters: layout?.gutters === "start" || layout?.gutters === "end" ? layout.gutters : "both",
    startSize: resolveGutterSize(layout?.startSize),
    endSize: resolveGutterSize(layout?.endSize),
  };
}

export function gutterTrack(size: GutterSize): string {
  if (size.mode === "min-content") return "min-content";
  return size.mode === "%" ? `${size.value}%` : `${size.value}px`;
}

/** The CSS grid tracks and the cells to draw, in order. */
export function layoutGeometry(input: Partial<LayoutWidgetLayout> | undefined): LayoutGeometry {
  const layout = resolveLayout(input);

  if (layout.type === "grid") {
    return {
      gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
      cells: Array.from({ length: layout.columns * layout.rows }, (_, index) => ({ index })),
    };
  }

  const horizontal = layout.orientation === "horizontal";
  const fitAxis = horizontal ? "width" : "height";
  const sides = layout.gutters;
  const tracks: string[] = [];
  const cells: LayoutCell[] = [];

  function addGutter(index: number, size: GutterSize) {
    tracks.push(gutterTrack(size));
    cells.push(size.mode === "min-content" ? { index, fit: fitAxis } : { index });
  }

  if (sides !== "end") addGutter(GUTTER_START_CELL, layout.startSize!);
  tracks.push("minmax(0, 1fr)");
  cells.push({ index: GUTTER_MAIN_CELL });
  if (sides !== "start") addGutter(GUTTER_END_CELL, layout.endSize!);

  const along = tracks.join(" ");
  return {
    gridTemplateColumns: horizontal ? along : "minmax(0, 1fr)",
    gridTemplateRows: horizontal ? "minmax(0, 1fr)" : along,
    cells,
  };
}
