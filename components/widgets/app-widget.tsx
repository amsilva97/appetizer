"use client";

import { useEffect, useState } from "react";
import type { AppWidgetConfig } from "@/types/app-widget";

type OnlineStatus = "checking" | "online" | "offline";

function useOnlineStatus(
  url: string | undefined,
  intervalSeconds: number,
): { status: OnlineStatus; lastChecked: Date | null } | null {
  const [status, setStatus] = useState<OnlineStatus>("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    if (!url || intervalSeconds === 0) return;

    let mounted = true;

    async function check() {
      if (!url) return;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      try {
        await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store", signal: controller.signal });
        if (mounted) { setStatus("online"); setLastChecked(new Date()); }
      } catch {
        if (mounted) { setStatus("offline"); setLastChecked(new Date()); }
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
  return { status, lastChecked };
}

function useTimeAgo(date: Date | null): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [date]);

  if (!date) return null;
  const s = Math.floor((now - date.getTime()) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const ICON_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-sky-500",
  "bg-emerald-500", "bg-teal-500", "bg-orange-500",
  "bg-rose-500", "bg-indigo-500", "bg-amber-500", "bg-pink-500",
];

function colorFor(title: string) {
  return ICON_COLORS[(title.charCodeAt(0) || 65) % ICON_COLORS.length];
}

function AppIcon({ url, title }: { url?: string; title: string }) {
  const [error, setError] = useState(false);
  const initials = title.slice(0, 2).toUpperCase() || "?";

  if (!url || error) {
    return (
      <div className={`w-9 h-9 rounded-[8px] ${colorFor(title)} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md select-none`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-9 h-9 rounded-[8px] object-contain shrink-0"
      onError={() => setError(true)}
    />
  );
}

function StatusPip({ status }: { status: OnlineStatus }) {
  if (status === "checking") {
    return <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse block shrink-0" />;
  }
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full block shrink-0 ${status === "online" ? "bg-emerald-400" : "bg-red-400"}`}
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

// ─── View variants ────────────────────────────────────────────────────────────

interface ViewProps {
  config: AppWidgetConfig;
  status: OnlineStatus | null;
  timeAgo: string | null;
}

function IconView({ config, status, timeAgo }: ViewProps) {
  const showLastPing = (config.showLastPing ?? false) && timeAgo !== null;
  return (
    <div className="flex items-center gap-3.5 h-full">
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
          <p className="text-xs text-white/55 mt-1.5 line-clamp-1 leading-snug">{config.description}</p>
        )}
        {showLastPing && (
          <p className="text-[10px] text-white/35 mt-1 tabular-nums">Checked {timeAgo}</p>
        )}
      </div>
    </div>
  );
}

function NoIconView({ config, status, timeAgo }: ViewProps) {
  const showLastPing = (config.showLastPing ?? false) && timeAgo !== null;
  return (
    <div className="min-w-0 pr-6 h-full flex flex-col justify-center">
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
        <p className="text-xs text-white/55 mt-1.5 line-clamp-1 leading-snug">{config.description}</p>
      )}
      {showLastPing && (
        <p className="text-[10px] text-white/35 mt-1 tabular-nums">Checked {timeAgo}</p>
      )}
    </div>
  );
}

function FullCoverView({ config, status, timeAgo }: ViewProps) {
  const [imgError, setImgError] = useState(false);
  const showLastPing = (config.showLastPing ?? false) && timeAgo !== null;

  return (
    <div className="relative h-full w-full">
      {/* Background: logo or color fallback */}
      {config.logoUrl && !imgError ? (
        <img
          src={config.logoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`absolute inset-0 ${colorFor(config.title)}`} />
      )}

      {/* Gradient scrim — dark at top for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />

      {/* Text overlay at top */}
      <div className="absolute top-0 left-0 right-0 p-4 pr-10">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white leading-tight truncate drop-shadow">
            {config.title || "Untitled"}
          </span>
          {status !== null && <StatusPip status={status} />}
        </div>
        {config.subtitle && (
          <p className="text-[11px] text-white/70 mt-0.5 truncate drop-shadow">{config.subtitle}</p>
        )}
        {showLastPing && (
          <p className="text-[10px] text-white/50 mt-0.5 tabular-nums">Checked {timeAgo}</p>
        )}
      </div>
    </div>
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
  const pingResult = useOnlineStatus(checkUrl, config.pingInterval);
  const status = pingResult?.status ?? null;
  const lastChecked = pingResult?.lastChecked ?? null;
  const timeAgo = useTimeAgo(lastChecked);

  const logoView = config.logoView ?? "icon";
  const clickable = config.clickable ?? true;
  const cardWidth = config.cardWidth ?? 256;
  const cardHeight = config.cardHeight ?? 64;

  const editBtn = (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onEdit(); }}
      title="Edit"
      className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/25 hover:text-white"
    >
      <PencilIcon />
    </button>
  );

  const viewProps: ViewProps = { config, status, timeAgo };

  if (logoView === "full") {
    return (
      <div className="relative group select-none" style={{ width: cardWidth }}>
        {editBtn}
        <div
          onClick={clickable ? onClick : undefined}
          title={clickable ? (config.tooltip || undefined) : undefined}
          style={{ height: cardHeight }}
          className={`overflow-hidden rounded-3xl border border-white/[0.12] shadow-2xl shadow-black/30 transition-all duration-200 ${
            clickable
              ? "cursor-pointer hover:border-white/20 hover:shadow-black/40"
              : "cursor-default"
          }`}
        >
          <FullCoverView {...viewProps} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative group select-none" style={{ width: cardWidth }}>
      {editBtn}
      <div
        onClick={clickable ? onClick : undefined}
        title={clickable ? (config.tooltip || undefined) : undefined}
        style={{ height: cardHeight }}
        className={`bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] rounded-3xl px-4 py-3 overflow-hidden shadow-2xl shadow-black/30 transition-all duration-200 ${
          clickable
            ? "cursor-pointer hover:bg-white/[0.13] hover:border-white/20"
            : "cursor-default"
        }`}
      >
        {logoView === "icon" && <IconView {...viewProps} />}
        {logoView === "none" && <NoIconView {...viewProps} />}
      </div>
    </div>
  );
}
