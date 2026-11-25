"use client";

import { useRef, useState } from "react";
import EdgeShadow from "@/components/widgets/edge-shadow";
import {
  activeDot,
  canStep,
  carouselModel,
  clampIndex,
  dotCount,
  dotTarget,
  itemAt,
  slotGeometry,
  slotsToRender,
  stepIndex,
} from "@/lib/carousel";
import { resolveEdgeSides, type EdgeShadowConfig } from "@/types/edge-shadow";
import type { MenuDirection } from "@/types/menu-widget";
import { spacingCss, type Spacing } from "@/types/spacing";

export interface CarouselItem {
  key: string;
  node: React.ReactNode;
}

interface Props {
  items: CarouselItem[];
  direction: MenuDirection;
  visibleCount?: number;
  infinite?: boolean;
  gap: number;
  padding: Spacing;
  edgeShadow: EdgeShadowConfig;
  /** Show a row of position dots. */
  showDots?: boolean;
  /** Pixels of the neighbouring apps left showing at each end. */
  peek?: number;
}

const SWIPE_PX = 40;
const WHEEL_MIN_DELTA = 8;
const WHEEL_COOLDOWN_MS = 350;

function Chevron({ dir }: { dir: "left" | "right" | "up" | "down" }) {
  const rotate = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rotate}deg)` }}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function Dots({ count, active, horizontal, onSelect }: { count: number; active: number; horizontal: boolean; onSelect: (dot: number) => void }) {
  const place: React.CSSProperties = horizontal
    ? { bottom: 6, left: "50%", transform: "translateX(-50%)", flexDirection: "row" }
    : { right: 6, top: "50%", transform: "translateY(-50%)", flexDirection: "column" };
  return (
    <div className="absolute z-10 flex gap-1.5" style={place}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          data-carousel-dot
          aria-label={`Go to ${i + 1} of ${count}`}
          aria-current={i === active ? "true" : undefined}
          onClick={() => onSelect(i)}
          className={`rounded-full transition-all ${i === active ? "bg-white" : "bg-white/35 hover:bg-white/60"}`}
          style={horizontal ? { width: i === active ? 18 : 6, height: 6 } : { width: 6, height: i === active ? 18 : 6 }}
        />
      ))}
    </div>
  );
}

export default function MenuCarousel({ items, direction, visibleCount, infinite, gap, padding, edgeShadow, showDots, peek = 0 }: Props) {
  const model = carouselModel(items.length, visibleCount, infinite);
  const horizontal = direction === "horizontal";
  const [rawIndex, setRawIndex] = useState(0);
  const index = clampIndex(rawIndex, model);
  const lastWheel = useRef(0);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  function go(delta: number) {
    if (!canStep(index, delta, model)) return;
    setRawIndex(stepIndex(index, delta, model));
  }

  function handleWheel(e: React.WheelEvent) {
    const d = horizontal && Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < WHEEL_MIN_DELTA) return;
    const now = e.timeStamp;
    if (now - lastWheel.current < WHEEL_COOLDOWN_MS) return;
    lastWheel.current = now;
    go(d > 0 ? 1 : -1);
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const d = horizontal ? e.clientX - start.x : e.clientY - start.y;
    if (Math.abs(d) < SWIPE_PX) return;
    swiped.current = true;
    go(d < 0 ? 1 : -1);
  }

  // A swipe ends on an app card; don't let it count as a click.
  function handleClickCapture(e: React.MouseEvent) {
    if (!swiped.current) return;
    swiped.current = false;
    e.stopPropagation();
    e.preventDefault();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    const fwd = horizontal ? "ArrowRight" : "ArrowDown";
    if (e.key === back) { e.preventDefault(); go(-1); }
    if (e.key === fwd) { e.preventDefault(); go(1); }
  }

  // Size by the requested slot count, so a short row keeps its tile size instead of stretching.
  const geo = slotGeometry(model.slots, gap, peek);
  const step = (k: number) => `calc(${k} * ${geo.step})`;
  const slotPos = (k: number) => `calc(${geo.offset} + ${k} * ${geo.step})`;
  const itemSize = geo.size;
  const dots = showDots ? dotCount(model) : 0;
  const sides = resolveEdgeSides(edgeShadow.edges, horizontal ? "horizontal" : "vertical");
  const atStart = !canStep(index, -1, model);
  const atEnd = !canStep(index, 1, model);

  const arrowBase =
    "absolute z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white/90 " +
    "opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 hover:bg-black/70 transition-opacity";
  const prevPos: React.CSSProperties = horizontal
    ? { left: 4, top: "50%", transform: "translateY(-50%)" }
    : { top: 4, left: "50%", transform: "translateX(-50%)" };
  const nextPos: React.CSSProperties = horizontal
    ? { right: 4, top: "50%", transform: "translateY(-50%)" }
    : { bottom: 4, left: "50%", transform: "translateX(-50%)" };

  return (
    <div
      className="relative flex-1 min-h-0 overflow-hidden group/carousel focus:outline-none"
      style={{ padding: spacingCss(padding) }}
      role="region"
      aria-roledescription="carousel"
      tabIndex={0}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
    >
      <div
        data-carousel-track
        className="relative w-full h-full"
        style={{
          transform: horizontal ? `translateX(${step(-index)})` : `translateY(${step(-index)})`,
          transition: "transform 300ms ease",
        }}
      >
        {slotsToRender(index, model).map((slot) => {
          const item = items[itemAt(slot, model)];
          return (
            <div
              key={model.looping ? `slot:${slot}` : item.key}
              data-carousel-slot={slot}
              className="absolute flex"
              style={horizontal
                ? { left: slotPos(slot), top: 0, width: itemSize, height: "100%" }
                : { top: slotPos(slot), left: 0, height: itemSize, width: "100%" }}
            >
              {item.node}
            </div>
          );
        })}
      </div>

      <EdgeShadow config={edgeShadow} sides={sides} />

      {!atStart && (
        <button type="button" aria-label="Previous" className={arrowBase} style={prevPos} onClick={() => go(-1)}>
          <Chevron dir={horizontal ? "left" : "up"} />
        </button>
      )}
      {!atEnd && (
        <button type="button" aria-label="Next" className={arrowBase} style={nextPos} onClick={() => go(1)}>
          <Chevron dir={horizontal ? "right" : "down"} />
        </button>
      )}

      {dots > 0 && (
        <Dots
          count={dots}
          active={activeDot(index, model)}
          horizontal={horizontal}
          onSelect={(dot) => setRawIndex(dotTarget(index, dot, model))}
        />
      )}
    </div>
  );
}
