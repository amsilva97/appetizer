"use client";

import type { LayoutWidgetConfig } from "@/types/layout-widget";
import type { WidgetInstance } from "@/types/widget";

interface Props {
  config: LayoutWidgetConfig;
  widgetId: string;
  allWidgets: WidgetInstance[];
  editMode?: boolean;
}

function toRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

export default function LayoutWidget({ config, widgetId, allWidgets, editMode }: Props) {
  const { columns, rows } = config.layout;
  const totalCells = columns * rows;

  const cellBg = toRgba(config.bgColor ?? "#ffffff", config.bgOpacity ?? 3);
  const cellBorder = toRgba(config.borderColor ?? "#ffffff", config.borderOpacity ?? 6);

  return (
    <div className="absolute" style={{ inset: config.margin }}>
      <div
        className="w-full h-full"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          padding: config.padding,
          gap: config.gap,
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => {
          const child = allWidgets.find(
            (w) => w.type === "layout" && w.parentId === widgetId && w.cellIndex === i
          );
          return (
            <div
              key={i}
              className="relative group"
              style={{
                backgroundColor: cellBg,
                border: `1px solid ${cellBorder}`,
              }}
            >
              {editMode && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/[0.06] transition-opacity pointer-events-none z-10" />
              )}
              {child && (
                <LayoutWidget
                  config={child.config as LayoutWidgetConfig}
                  widgetId={child.id}
                  allWidgets={allWidgets}
                  editMode={editMode}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
