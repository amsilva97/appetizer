import { describe, expect, test } from "vitest";
import { resolveSpacing, spacingCss, isUniform } from "@/types/spacing";
import { resolveAppPadding } from "@/types/app-widget";
import { DEFAULT_EDGE_SHADOW, edgeShadowStops, resolveEdgeSides, resolveEdgeShadow } from "@/types/edge-shadow";
import { layoutGeometry, resolveLayout, GUTTER_START_CELL, GUTTER_MAIN_CELL, GUTTER_END_CELL } from "@/lib/layout-cells";
import { cellTargetsFromElements, CELL_INDEX_ATTR, CELL_LAYOUT_ATTR } from "@/lib/cell-targets";
import { canStep, carouselModel, itemAt, slotsToRender, stepIndex } from "@/lib/carousel";
import { normalizeLayoutConfig, normalizeMenuConfig } from "@/lib/widget-config";
import { applyDraft, draftDiffers } from "@/lib/use-widget-draft";
import type { WidgetInstance } from "@/types/widget";
import { DEFAULT_LAYOUT_WIDGET } from "@/types/layout-widget";

describe("spacing", () => {
  test("reads a legacy number as every side", () => {
    expect(resolveSpacing(8)).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
  });

  test("fills missing sides from the fallback", () => {
    expect(resolveSpacing({ top: 4 } as never, 2)).toEqual({ top: 4, right: 2, bottom: 2, left: 2 });
    expect(resolveSpacing(undefined, 3)).toEqual({ top: 3, right: 3, bottom: 3, left: 3 });
  });

  test("writes CSS in top right bottom left order", () => {
    expect(spacingCss({ top: 1, right: 2, bottom: 3, left: 4 })).toBe("1px 2px 3px 4px");
    expect(isUniform({ top: 1, right: 1, bottom: 1, left: 2 })).toBe(false);
  });

  test("legacy app padding only pads the header's left and right", () => {
    expect(resolveAppPadding(16)).toEqual({ top: 0, right: 16, bottom: 0, left: 16 });
    expect(resolveAppPadding({ top: 4, right: 5, bottom: 6, left: 7 })).toEqual({ top: 4, right: 5, bottom: 6, left: 7 });
  });
});

describe("edge shadow", () => {
  test("auto follows the widget's own axis", () => {
    expect(resolveEdgeSides("auto", "horizontal")).toEqual({ top: false, right: true, bottom: false, left: true });
    expect(resolveEdgeSides("auto", "all")).toEqual({ top: true, right: true, bottom: true, left: true });
    expect(resolveEdgeSides("vertical", "horizontal")).toEqual({ top: true, right: false, bottom: true, left: false });
  });

  test("is off unless turned on", () => {
    expect(resolveEdgeShadow(undefined).enabled).toBe(false);
  });
});

describe("layout geometry", () => {
  test("grid draws columns × rows cells", () => {
    const g = layoutGeometry({ type: "grid", columns: 3, rows: 2 });
    expect(g.cells.map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(g.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))");
  });

  test("horizontal gutters sit left and right of the main area", () => {
    const g = layoutGeometry({
      type: "gutters", columns: 1, rows: 1,
      orientation: "horizontal", gutters: "both",
      startSize: { mode: "px", value: 200 }, endSize: { mode: "%", value: 25 },
    });
    expect(g.gridTemplateColumns).toBe("200px minmax(0, 1fr) 25%");
    expect(g.gridTemplateRows).toBe("minmax(0, 1fr)");
    expect(g.cells.map((c) => c.index)).toEqual([GUTTER_START_CELL, GUTTER_MAIN_CELL, GUTTER_END_CELL]);
  });

  test("vertical gutters stack, and a single gutter keeps its cell number", () => {
    const g = layoutGeometry({
      type: "gutters", columns: 1, rows: 1,
      orientation: "vertical", gutters: "end",
      endSize: { mode: "min-content", value: 0 },
    });
    expect(g.gridTemplateRows).toBe("minmax(0, 1fr) min-content");
    expect(g.cells).toEqual([{ index: GUTTER_MAIN_CELL }, { index: GUTTER_END_CELL, fit: "height" }]);
  });

  test("min-content gutters fit along the gutter axis", () => {
    const g = layoutGeometry({
      type: "gutters", columns: 1, rows: 1, orientation: "horizontal", gutters: "start",
      startSize: { mode: "min-content", value: 0 },
    });
    expect(g.cells[0]).toEqual({ index: GUTTER_START_CELL, fit: "width" });
  });

  test("bad or missing values fall back to something drawable", () => {
    const l = resolveLayout({ type: "grid", columns: 99, rows: -1 });
    expect(l.columns).toBe(12);
    expect(l.rows).toBe(1);
    expect(resolveLayout(undefined).type).toBe("grid");
  });
});

describe("cell targets", () => {
  function cell(widgetId: string, index: number): Element {
    const el = document.createElement("div");
    el.setAttribute(CELL_LAYOUT_ATTR, widgetId);
    el.setAttribute(CELL_INDEX_ATTR, String(index));
    return el;
  }

  test("returns cells outermost first, skipping other elements", () => {
    const els = [document.createElement("span"), cell("inner", 2), cell("outer", 0), document.body];
    expect(cellTargetsFromElements(els)).toEqual([
      { widgetId: "outer", cellIndex: 0 },
      { widgetId: "inner", cellIndex: 2 },
    ]);
  });
});

describe("carousel paging", () => {
  test("never pages past the items there are", () => {
    expect(carouselModel(2, 5, false).visible).toBe(2);
    expect(carouselModel(2, 5, false).maxIndex).toBe(0);
    expect(carouselModel(0, 3, true).looping).toBe(false);
  });

  test("keeps the slot size set by visibleCount when there are fewer items", () => {
    expect(carouselModel(2, 5, false).slots).toBe(5);
    expect(carouselModel(8, 5, false).slots).toBe(5);
    expect(carouselModel(2, 40, false).slots).toBe(12);
    expect(carouselModel(2, 0, false).slots).toBe(1);
  });

  test("a list carousel stops at its ends", () => {
    const m = carouselModel(5, 3, false);
    expect(canStep(0, -1, m)).toBe(false);
    expect(stepIndex(1, 5, m)).toBe(2);
    expect(canStep(2, 1, m)).toBe(false);
    expect(slotsToRender(0, m)).toEqual([0, 1, 2, 3, 4]);
  });

  test("an infinite carousel wraps both ways", () => {
    const m = carouselModel(4, 3, true);
    expect(m.looping).toBe(true);
    expect(canStep(0, -1, m)).toBe(true);
    expect(stepIndex(0, -1, m)).toBe(-1);
    expect(itemAt(-1, m)).toBe(3);
    expect(itemAt(4, m)).toBe(0);
    // In view plus one buffer slot each side.
    expect(slotsToRender(0, m)).toEqual([-1, 0, 1, 2, 3]);
  });

  test("doesn't loop when everything already fits", () => {
    expect(carouselModel(3, 3, true).looping).toBe(false);
  });
});

describe("YAML normalisation", () => {
  test("rejects non-objects", () => {
    expect(normalizeLayoutConfig("columns: ")).toBeNull();
    expect(normalizeMenuConfig(null)).toBeNull();
    expect(normalizeMenuConfig([1])).toBeNull();
  });

  test("fills a partial layout so it can render", () => {
    const cfg = normalizeLayoutConfig({ label: "X", layout: { type: "gutters" } })!;
    expect(cfg.layout.columns).toBe(DEFAULT_LAYOUT_WIDGET.layout.columns);
    expect(cfg.layout.type).toBe("gutters");
    expect(cfg.label).toBe("X");
  });
});

describe("widget drafts", () => {
  const widgets: WidgetInstance[] = [
    { id: "a", type: "menu", config: { ...DEFAULT_LAYOUT_WIDGET, label: "A" }, x: 0, y: 0 },
    { id: "b", type: "menu", config: { ...DEFAULT_LAYOUT_WIDGET, label: "B" }, x: 0, y: 0 },
  ];

  test("puts the draft over the saved widget without touching the others", () => {
    const draft = { id: "a", config: { ...DEFAULT_LAYOUT_WIDGET, label: "A2" }, permissions: ["x"] };
    const out = applyDraft(widgets, draft);
    expect((out[0].config as { label: string }).label).toBe("A2");
    expect(out[0].permissions).toEqual(["x"]);
    expect(out[1]).toBe(widgets[1]);
    expect((widgets[0].config as { label: string }).label).toBe("A");
  });

  test("a draft equal to what's saved has no changes", () => {
    expect(draftDiffers({ id: "a", config: widgets[0].config, permissions: [] }, widgets[0])).toBe(false);
    expect(draftDiffers({ id: "a", config: widgets[0].config, permissions: ["p"] }, widgets[0])).toBe(true);
  });
});

describe("edge shadow depths", () => {
  test("full strength up to the first depth, clear by the second", () => {
    expect(edgeShadowStops({ ...DEFAULT_EDGE_SHADOW, solidSize: 20, size: 100 }, "S", "C")).toBe("S 0px, S 20px, C 100px");
  });

  test("older configs without a full-strength depth fade from the edge", () => {
    const { solidSize: _unused, ...legacy } = DEFAULT_EDGE_SHADOW;
    void _unused;
    expect(edgeShadowStops({ ...legacy, size: 48 }, "S", "C")).toBe("S 0px, S 0px, C 48px");
  });

  test("a full-strength depth past the fade-out is capped there", () => {
    expect(edgeShadowStops({ ...DEFAULT_EDGE_SHADOW, solidSize: 300, size: 100 }, "S", "C")).toBe("S 0px, S 100px, C 100px");
  });
});
