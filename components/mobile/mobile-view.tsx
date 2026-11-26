"use client";

import { useRef, useState } from "react";
import AppWidget from "@/components/widgets/app-widget";
import BackgroundRenderer from "@/components/background-renderer";
import { openAppUrl, phoneAppConfig, phoneColumns, resolveMobileSlots, showsFeed, PHONE_GRID_COLUMNS } from "@/lib/mobile";
import { neighbourPage, type SwipeDirection } from "@/lib/swipe";
import { PULL_TRIGGER_PX, usePhoneGestures } from "./use-phone-gestures";
import type { MobileConfig } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { BackgroundConfig } from "@/types/background";
import type { PageMeta } from "@/types/permissions";

interface Props {
  config: MobileConfig;
  /** The page's widgets, already filtered for the viewer by the server. */
  widgets: WidgetInstance[];
  background: BackgroundConfig;
  /** Pages that have a phone version, in tab order. */
  pages: PageMeta[];
  currentPage: string;
  onPageChange: (name: string) => void;
  /** Load the current page again; resolves once it has. */
  onRefresh: () => Promise<void>;
}

type Enter = "left" | "right" | null;

function SpinnerIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={spinning ? "animate-spin" : undefined}>
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}

interface PageDotsProps {
  pages: PageMeta[];
  currentPage: string;
  onPick: (name: string) => void;
}

/** One dot per page; the current page's dot is wider. Tapping a dot goes to that page. */
function PageDots({ pages, currentPage, onPick }: PageDotsProps) {
  return (
    <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none">
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/30 backdrop-blur-md pointer-events-auto">
        {pages.map((p) => {
          const active = p.name === currentPage;
          return (
            <button
              key={p.name}
              type="button"
              aria-label={p.label}
              aria-current={active ? "page" : undefined}
              onClick={() => onPick(p.name)}
              className="p-1"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-200 ${active ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The page's phone version: its chosen app cards in rows, with swipes between pages and pull down to refresh. */
export default function MobileView({ config, widgets, background, pages, currentPage, onPageChange, onRefresh }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Bumped after a refresh so every card mounts again and fetches its feed and status afresh.
  const [refreshCount, setRefreshCount] = useState(0);

  // Which side the page came in from, worked out when the page changes.
  const [shown, setShown] = useState<{ page: string; enter: Enter }>({ page: currentPage, enter: null });
  if (shown.page !== currentPage) {
    const names = pages.map((p) => p.name);
    const from = names.indexOf(shown.page);
    const to = names.indexOf(currentPage);
    setShown({ page: currentPage, enter: from === -1 || to === -1 ? null : to > from ? "right" : "left" });
  }

  const gestures = usePhoneGestures({
    scrollerRef,
    onSwipe: (direction: SwipeDirection) => {
      const target = neighbourPage(pages.map((p) => p.name), currentPage, direction);
      if (target) onPageChange(target);
    },
    onRefresh: async () => {
      await onRefresh();
      setRefreshCount((n) => n + 1);
    },
  });

  const cards = resolveMobileSlots(config.slots ?? [], widgets);
  const pullShown = gestures.refreshing ? PULL_TRIGGER_PX : gestures.pull;
  const enterClass = shown.enter ? `phone-enter-${shown.enter}` : "";

  return (
    <div className="fixed inset-0 z-0 flex flex-col" {...gestures.handlers}>
      <BackgroundRenderer config={background} />

      {/* pull-to-refresh indicator, just under the toolbar */}
      <div
        className="absolute left-0 right-0 top-14 z-10 flex justify-center pointer-events-none text-white/80"
        style={{ opacity: Math.min(pullShown / PULL_TRIGGER_PX, 1), transform: `translateY(${pullShown / 2}px)` }}
        aria-hidden={!gestures.refreshing}
      >
        <span className="p-2 rounded-full bg-black/40 backdrop-blur-md" style={{ transform: gestures.refreshing ? undefined : `rotate(${pullShown * 4}deg)` }}>
          <SpinnerIcon spinning={gestures.refreshing} />
        </span>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto overscroll-y-contain relative z-10 pb-14">
        <div
          key={`${currentPage}:${refreshCount}`}
          className={`grid gap-3 p-4 pt-16 items-start ${enterClass}`}
          style={{
            gridTemplateColumns: `repeat(${PHONE_GRID_COLUMNS}, minmax(0, 1fr))`,
            transform: pullShown ? `translateY(${pullShown}px)` : undefined,
            transition: gestures.pull ? undefined : "transform 150ms ease-out",
          }}
        >
          {cards.map(({ widget, slot }) => {
            const cfg = phoneAppConfig(widget.config as AppWidgetConfig, slot);
            return (
              <div key={widget.id} className="min-w-0" style={{ gridColumn: `span ${phoneColumns(slot.span, showsFeed(cfg))}` }}>
                <AppWidget config={cfg} widgetId={widget.id} fillAxis="width" onClick={() => openAppUrl(cfg.url)} />
              </div>
            );
          })}
          {cards.length === 0 && (
            <p className="col-span-full text-center text-zinc-400 text-sm mt-16">Nothing on the phone version yet.</p>
          )}
        </div>
      </div>

      {pages.length > 1 && <PageDots pages={pages} currentPage={currentPage} onPick={onPageChange} />}
    </div>
  );
}
