"use client";

import type { MenuWidgetConfig } from "@/types/menu-widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { WidgetInstance } from "@/types/widget";
import AppWidget from "@/components/widgets/app-widget";
import EdgeShadow from "@/components/widgets/edge-shadow";
import MenuCarousel from "@/components/widgets/menu-carousel";
import { openAppUrl } from "@/lib/mobile";
import { toRgba } from "@/lib/color";
import { resolveEdgeShadow, resolveEdgeSides, type EdgeShadowConfig, type EdgeSides } from "@/types/edge-shadow";
import { resolveSpacing, spacingCss, type Spacing } from "@/types/spacing";

interface Props {
  config: MenuWidgetConfig;
  widgetId: string;
  allWidgets: WidgetInstance[];
  editMode?: boolean;
  /** The cell sizes to this menu's content along this axis (a min-content gutter). */
  fit?: "width" | "height";
}

function MenuList({
  apps,
  horizontal,
  padding,
  gap,
  edgeShadow,
}: {
  apps: React.ReactNode;
  horizontal: boolean;
  padding: Spacing;
  gap: number;
  edgeShadow: EdgeShadowConfig;
}) {
  const sides: EdgeSides = resolveEdgeSides(edgeShadow.edges, horizontal ? "horizontal" : "vertical");

  return (
    <div className="relative flex-1 min-h-0 flex">
      <div
        className="flex-1 overflow-auto"
        style={{
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          padding: spacingCss(padding),
          gap,
        }}
      >
        {apps}
      </div>
      <EdgeShadow config={edgeShadow} sides={sides} />
    </div>
  );
}

export default function MenuWidget({ config, widgetId, allWidgets, fit }: Props) {
  const bg = toRgba(config.bgColor ?? "#ffffff", config.bgOpacity ?? 5);
  const border = toRgba(config.borderColor ?? "#ffffff", config.borderOpacity ?? 10);
  const margin = resolveSpacing(config.margin, 0);
  const padding = resolveSpacing(config.padding, 8);
  const gap = config.gap ?? 8;
  const edgeShadow = resolveEdgeShadow(config.edgeShadow);
  const horizontal = config.direction === "horizontal";
  const isCarousel = config.type === "carousel";

  const appChildren = allWidgets.filter((w) => w.type === "app" && w.parentId === widgetId);

  // A list fills across its flow; a carousel slot fills both ways. In a
  // content-sized cell the apps keep their own size on that axis instead.
  const listFill: "width" | "height" = horizontal ? "height" : "width";
  const fillAxis = isCarousel ? "both" : fit === listFill ? undefined : listFill;

  const nodes = appChildren.map((child) => {
    const cfg = child.config as AppWidgetConfig;
    return {
      key: child.id,
      node: (
        <AppWidget
          key={child.id}
          config={cfg}
          widgetId={child.id}
          fillAxis={fillAxis}
          onClick={() => openAppUrl(cfg.url)}
        />
      ),
    };
  });

  // Normally the menu fills its cell. When the cell sizes to content, the menu
  // has to be in the flow so the cell can measure it.
  const boxStyle: React.CSSProperties = fit
    ? {
        position: "relative",
        margin: spacingCss(margin),
        [fit === "width" ? "height" : "width"]: fit === "width"
          ? `calc(100% - ${margin.top + margin.bottom}px)`
          : `calc(100% - ${margin.left + margin.right}px)`,
      }
    : {
        position: "absolute",
        top: margin.top,
        right: margin.right,
        bottom: margin.bottom,
        left: margin.left,
      };

  return (
    <div
      data-menu-widget={widgetId}
      className="flex flex-col overflow-hidden"
      style={{
        ...boxStyle,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: config.borderRadius ?? 8,
      }}
    >
      <div className="shrink-0 px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {config.label}
      </div>

      {isCarousel ? (
        <MenuCarousel
          items={nodes}
          direction={config.direction}
          visibleCount={config.visibleCount}
          infinite={config.infinite}
          gap={gap}
          padding={padding}
          edgeShadow={edgeShadow}
        />
      ) : (
        <MenuList
          apps={nodes.map((n) => n.node)}
          horizontal={horizontal}
          padding={padding}
          gap={gap}
          edgeShadow={edgeShadow}
        />
      )}
    </div>
  );
}
