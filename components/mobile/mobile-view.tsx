"use client";

import { useState } from "react";
import AppWidget from "@/components/widgets/app-widget";
import type { MobileConfig, MobileScreen } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { BackgroundConfig } from "@/types/background";
import BackgroundRenderer from "@/components/background-renderer";

interface Props {
  config: MobileConfig;
  widgets: WidgetInstance[];
  background: BackgroundConfig;
}

function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export default function MobileView({ config, widgets, background }: Props) {
  const [activeScreen, setActiveScreen] = useState(0);

  const screens = config.screens ?? [];
  const current: MobileScreen | undefined = screens[activeScreen];
  const slots = current?.slots ?? [];

  const slottedWidgets = slots
    .map((id) => widgets.find((w) => w.id === id))
    .filter((w): w is WidgetInstance => w !== undefined);

  return (
    <div className="fixed inset-0 z-0 flex flex-col">
      <BackgroundRenderer config={background} />

      {/* scrollable widget stack */}
      <div className="flex-1 overflow-y-auto relative z-10" style={{ paddingBottom: 72 }}>
        <div className="flex flex-col gap-3 p-4 pt-6">
          {slottedWidgets.map((w) => {
            if (w.type === "app") {
              return (
                <AppWidget
                  key={w.id}
                  config={w.config as AppWidgetConfig}
                  onClick={() => {
                    const cfg = w.config as AppWidgetConfig;
                    if (cfg.url) window.open(cfg.url, "_blank");
                  }}
                  fillAxis="width"
                />
              );
            }
            return null;
          })}
          {slottedWidgets.length === 0 && (
            <p className="text-center text-zinc-600 text-sm mt-16">No widgets on this screen.</p>
          )}
        </div>
      </div>

      {/* bottom nav */}
      {screens.length > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/[0.08] flex items-center justify-around"
          style={{
            height: 64,
            backgroundColor: "rgba(10,10,15,0.85)",
            backdropFilter: "blur(16px)",
          }}
        >
          {screens.map((screen, i) => {
            const isActive = i === activeScreen;
            return (
              <button
                key={screen.name}
                onClick={() => setActiveScreen(i)}
                className="flex flex-col items-center gap-1 px-4 py-2 transition-opacity"
                style={{ opacity: isActive ? 1 : 0.4 }}
              >
                <HomeIcon size={20} />
                <span className="text-[10px] font-medium text-white truncate max-w-16">{screen.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
