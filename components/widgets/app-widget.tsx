"use client";

import { useEffect, useState } from "react";
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
        await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store", signal: controller.signal });
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
    return () => { mounted = false; clearInterval(timer); };
  }, [url, intervalSeconds]);

  if (!url || intervalSeconds === 0) return null;
  return status;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ICON_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-sky-500",
  "bg-emerald-500", "bg-teal-500", "bg-orange-500",
  "bg-rose-500", "bg-indigo-500", "bg-amber-500", "bg-pink-500",
];

function AppIcon({ url, title }: { url?: string; title: string }) {
  const [error, setError] = useState(false);
  const color = ICON_COLORS[(title.charCodeAt(0) || 65) % ICON_COLORS.length];
  const initials = title.slice(0, 2).toUpperCase() || "?";

  if (!url || error) {
    return (
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md select-none`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-12 h-12 rounded-2xl object-contain shrink-0"
      onError={() => setError(true)}
    />
  );
}

function StatusPip({ status }: { status: OnlineStatus }) {
  if (status === "checking") {
    return <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse block" />;
  }
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full block ${status === "online" ? "bg-emerald-400" : "bg-red-400"}`}
      title={status === "online" ? "Online" : "Offline"}
    />
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

// ─── Widget card ──────────────────────────────────────────────────────────────

interface AppWidgetProps {
  config: AppWidgetConfig;
  onEdit: () => void;
  onClick: () => void;
}

export default function AppWidget({ config, onEdit, onClick }: AppWidgetProps) {
  const checkUrl = config.ping ? (config.pingUrl || config.url) || undefined : undefined;
  const status = useOnlineStatus(checkUrl, config.pingInterval);

  return (
    <div className="relative group select-none w-64">
      {/* Edit button — inside card, top-right, appears on hover */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Edit"
        className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/25 hover:text-white"
      >
        <PencilIcon />
      </button>

      {/* Card */}
      <div
        onClick={onClick}
        title={config.tooltip || undefined}
        className="bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-4 cursor-pointer hover:bg-white/[0.13] hover:border-white/20 transition-all duration-200 shadow-2xl shadow-black/30"
      >
        <div className="flex items-center gap-3.5">
          <AppIcon url={config.logoUrl} title={config.title} />

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white leading-tight truncate">
                {config.title || "Untitled"}
              </span>
              {status !== null && <StatusPip status={status} />}
            </div>

            {config.subtitle && (
              <p className="text-[11px] text-white/50 mt-0.5 truncate">{config.subtitle}</p>
            )}

            {config.description && (
              <p className="text-xs text-white/55 mt-1.5 line-clamp-2 leading-snug">
                {config.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
