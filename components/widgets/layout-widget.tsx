"use client";

import type { LayoutWidgetConfig } from "@/types/layout-widget";
import type { MenuWidgetConfig } from "@/types/menu-widget";
import type { WidgetInstance } from "@/types/widget";
import MenuWidget from "@/components/widgets/menu-widget";
import EdgeShadow from "@/components/widgets/edge-shadow";
import { layoutGeometry } from "@/lib/layout-cells";
import { CELL_INDEX_ATTR, CELL_LAYOUT_ATTR } from "@/lib/cell-targets";
import { toRgba } from "@/lib/color";
import { resolveEdgeShadow, resolveEdgeSides } from "@/types/edge-shadow";
import { resolveSpacing, spacingCss } from "@/types/spacing";

interface Props {
  config: LayoutWidgetConfig;
  widgetId: string;
  allWidgets: WidgetInstance[];
  editMode?: boolean;
}

export default function LayoutWidget({ config, widgetId, allWidgets, editMode }: Props) {
  const geometry = layoutGeometry(config.layout);
  const margin = resolveSpacing(config.margin, 0);
  const padding = resolveSpacing(config.padding, 0);
  const edgeShadow = resolveEdgeShadow(config.edgeShadow);

  const cellBg = toRgba(config.bgColor ?? "#ffffff", config.bgOpacity ?? 3);
  const cellBorder = toRgba(config.borderColor ?? "#ffffff", config.borderOpacity ?? 6);

  return (
    <div
      data-layout-widget={widgetId}
      className="absolute overflow-hidden"
      style={{
        top: margin.top,
        right: margin.right,
        bottom: margin.bottom,
        left: margin.left,
        borderRadius: editMode ? (config.borderRadius ?? 0) : 0,
      }}
    >
      <div
        className="w-full h-full"
        style={{
          display: "grid",
          gridTemplateColumns: geometry.gridTemplateColumns,
          gridTemplateRows: geometry.gridTemplateRows,
          padding: spacingCss(padding),
          gap: config.gap ?? 0,
        }}
      >
        {geometry.cells.map(({ index, fit }) => {
          const child = allWidgets.find(
            (w) => (w.type === "layout" || w.type === "menu") && w.parentId === widgetId && w.cellIndex === index
          );
          return (
            <div
              key={index}
              {...{ [CELL_LAYOUT_ATTR]: widgetId, [CELL_INDEX_ATTR]: index }}
              className="relative group min-w-0 min-h-0"
              style={editMode ? {
                backgroundColor: cellBg,
                border: `1px solid ${cellBorder}`,
              } : undefined}
            >
              {editMode && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/[0.06] transition-opacity pointer-events-none z-10" />
              )}
              {child?.type === "layout" && (
                <LayoutWidget
                  config={child.config as LayoutWidgetConfig}
                  widgetId={child.id}
                  allWidgets={allWidgets}
                  editMode={editMode}
                />
              )}
              {child?.type === "menu" && (
                <MenuWidget
                  config={child.config as MenuWidgetConfig}
                  widgetId={child.id}
                  allWidgets={allWidgets}
                  editMode={editMode}
                  fit={fit}
                />
              )}
            </div>
          );
        })}
      </div>
      <EdgeShadow config={edgeShadow} sides={resolveEdgeSides(edgeShadow.edges, "all")} />
    </div>
  );
}
