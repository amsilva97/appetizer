"use client";

import AppWidget from "@/components/widgets/app-widget";
import BackgroundRenderer from "@/components/background-renderer";
import { openAppUrl, phoneAppConfig, resolveMobileSlots } from "@/lib/mobile";
import type { MobileConfig } from "@/types/mobile";
import type { WidgetInstance } from "@/types/widget";
import type { AppWidgetConfig } from "@/types/app-widget";
import type { BackgroundConfig } from "@/types/background";

interface Props {
  config: MobileConfig;
  /** The page's widgets, already filtered for the viewer by the server. */
  widgets: WidgetInstance[];
  background: BackgroundConfig;
}

/** The page's phone version: its chosen app cards as one scrolling stack. */
export default function MobileView({ config, widgets, background }: Props) {
  const cards = resolveMobileSlots(config.slots ?? [], widgets);

  return (
    <div className="fixed inset-0 z-0 flex flex-col">
      <BackgroundRenderer config={background} />

      <div className="flex-1 overflow-y-auto relative z-10 pb-4">
        <div className="flex flex-col gap-3 p-4 pt-16">
          {cards.map((w) => {
            const cfg = phoneAppConfig(w.config as AppWidgetConfig);
            return <AppWidget key={w.id} config={cfg} widgetId={w.id} fillAxis="width" onClick={() => openAppUrl(cfg.url)} />;
          })}
          {cards.length === 0 && (
            <p className="text-center text-zinc-400 text-sm mt-16">Nothing on this page&apos;s phone version yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
