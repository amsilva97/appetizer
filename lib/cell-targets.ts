export interface CellTarget {
  widgetId: string;
  cellIndex: number;
}

/** Data attributes every layout cell carries, so a right-click can find it in the DOM. */
export const CELL_LAYOUT_ATTR = "data-layout-cell";
export const CELL_INDEX_ATTR = "data-cell-index";

/**
 * Layout cells under a point, outermost first.
 *
 * `elements` is what `document.elementsFromPoint` returns: topmost (innermost)
 * first. Reading the cells from the DOM means the context menu always agrees
 * with what's drawn, whatever the layout type.
 */
export function cellTargetsFromElements(elements: readonly Element[]): CellTarget[] {
  const targets: CellTarget[] = [];
  const seen = new Set<string>();
  for (const el of elements) {
    const widgetId = el.getAttribute(CELL_LAYOUT_ATTR);
    const raw = el.getAttribute(CELL_INDEX_ATTR);
    if (!widgetId || raw === null) continue;
    const cellIndex = Number(raw);
    if (!Number.isInteger(cellIndex) || seen.has(widgetId)) continue;
    seen.add(widgetId);
    targets.push({ widgetId, cellIndex });
  }
  return targets.reverse();
}
