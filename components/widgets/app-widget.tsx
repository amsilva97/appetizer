"use client";

import { useEffect, useRef, useState } from "react";
import type { AppWidgetConfig } from "@/types/app-widget";

type OnlineStatus = "checking" | "online" | "offline";

function useOnlineStatus(url: string | undefined, intervalSeconds: number): OnlineStatus | null {
  const [status, setStatus] = useState<OnlineStatus>("checking");

  useEffect(() => {
    if (!url || intervalSeconds === 0) return;

    let mounted = true;

    async function check() {
      if (!url) return;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      try {
        await fetch(url, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        });
        if (mounted) setStatus("online");
      } catch {
        if (mounted) setStatus("offline");
      } finally {
        clearTimeout(t);
      }
    }

    setStatus("checking");
    check();
    const timer = setInterval(check, intervalSeconds * 1000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [url, intervalSeconds]);

  if (!url || intervalSeconds === 0) return null;
  return status;
}

function StatusDot({ status }: { status: OnlineStatus }) {
  if (status === "checking") {
    return <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse block" />;
  }
  return (
    <span
      className={`w-2 h-2 rounded-full block ${status === "online" ? "bg-emerald-400" : "bg-red-400"}`}
      title={status === "online" ? "Online" : "Offline"}
    />
  );
}

function WidgetLogo({ url, title }: { url?: string; title: string }) {
  const [error, setError] = useState(false);
  const initials = title.slice(0, 2).toUpperCase() || "?";

  if (!url || error) {
    return (
      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-11 h-11 rounded-xl object-contain shrink-0"
      onError={() => setError(true)}
    />
  );
}

interface AppWidgetProps {
  config: AppWidgetConfig;
  onEdit: () => void;
  onClick: () => void;
}

export default function AppWidget({ config, onEdit, onClick }: AppWidgetProps) {
  const checkUrl = config.ping ? (config.pingUrl || config.url) || undefined : undefined;
  const status = useOnlineStatus(checkUrl, config.pingInterval);

  return (
    <div className="relative group select-none" style={{ width: 280 }}>
      {/* Edit button */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm text-white/80 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        title="Edit widget"
      >
        ✎
      </button>

      {/* Card */}
      <div
        onClick={onClick}
        title={config.tooltip || undefined}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/15 hover:border-white/30 transition-all duration-200 shadow-xl shadow-black/20"
      >
        <div className="flex items-start gap-3">
          <WidgetLogo url={config.logoUrl} title={config.title} />

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-white text-sm leading-tight truncate">
                {config.title || "Untitled"}
              </span>
              {config.subtitle && (
                <span className="text-xs text-white/50 shrink-0">{config.subtitle}</span>
              )}
            </div>
            {config.description && (
              <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-snug">
                {config.description}
              </p>
            )}
          </div>

          {status !== null && (
            <div className="mt-1 shrink-0">
              <StatusDot status={status} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
