"use client";

import type { GroupWidgetConfig } from "@/types/group-widget";
import type { WidgetInstance } from "@/types/widget";

interface Props {
  config: GroupWidgetConfig;
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

export default function GroupWidget({ config, editMode }: Props) {
  const bg = toRgba(config.bgColor ?? "#ffffff", config.bgOpacity ?? 5);
  const border = toRgba(config.borderColor ?? "#ffffff", config.borderOpacity ?? 10);

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: config.borderRadius ?? 8,
      }}
    >
      <div className="shrink-0 px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {config.label}
      </div>

      <div
        className="flex-1 overflow-auto"
        style={{
          display: "flex",
          flexDirection: config.direction === "horizontal" ? "row" : "column",
          padding: config.padding ?? 8,
          gap: config.gap ?? 8,
        }}
      />
    </div>
  );
}
