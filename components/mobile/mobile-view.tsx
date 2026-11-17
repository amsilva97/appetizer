"use client";

import { useState } from "react";
import AppWidget from "@/components/widgets/app-widget";
import BackgroundRenderer from "@/components/background-renderer";
import { openAppUrl, phoneAppConfig, resolveMobileSlots } from "@/lib/mobile";
import type { MobileConfig } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { MenuWidgetConfig } from "@/types/menu-widget";
import type { BackgroundConfig } from "@/types/background";

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

function PhoneCard({ widget }: { widget: WidgetInstance }) {
  const cfg = phoneAppConfig(widget.config as AppWidgetConfig);
  return <AppWidget config={cfg} widgetId={widget.id} fillAxis="width" onClick={() => openAppUrl(cfg.url)} />;
}

export default function MobileView({ config, widgets, background }: Props) {
  const [activeScreen, setActiveScreen] = useState(0);

  const screens = config.screens ?? [];
  const items = resolveMobileSlots(screens[activeScreen]?.slots ?? [], widgets);

  return (
    <div className="fixed inset-0 z-0 flex flex-col">
      <BackgroundRenderer config={background} />

      {/* scrollable widget stack */}
      <div className="flex-1 overflow-y-auto relative z-10" style={{ paddingBottom: screens.length > 1 ? 72 : 16 }}>
        <div className="flex flex-col gap-3 p-4 pt-16">
          {items.map((item) =>
            item.kind === "app" ? (
              <PhoneCard key={item.widget.id} widget={item.widget} />
            ) : (
              <section key={item.widget.id} className="flex flex-col gap-3">
                <h2 className="px-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {(item.widget.config as MenuWidgetConfig).label}
                </h2>
                {item.children.map((child) => (
                  <PhoneCard key={child.id} widget={child} />
                ))}
              </section>
            )
          )}
          {items.length === 0 && (
            <p className="text-center text-zinc-400 text-sm mt-16">No widgets on this screen.</p>
          )}
        </div>
      </div>

      {/* bottom nav */}
      {screens.length > 1 && (
        <nav
          className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/[0.08] flex items-center justify-around"
          style={{ height: 64, backgroundColor: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)" }}
        >
          {screens.map((screen, i) => (
            <button
              key={screen.name}
              onClick={() => setActiveScreen(i)}
              aria-current={i === activeScreen ? "page" : undefined}
              className="flex flex-col items-center gap-1 px-4 py-2 text-white transition-opacity"
              style={{ opacity: i === activeScreen ? 1 : 0.4 }}
            >
              <HomeIcon size={20} />
              <span className="text-[10px] font-medium truncate max-w-16">{screen.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
