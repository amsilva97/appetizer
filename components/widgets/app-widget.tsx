"use client";

import { useEffect, useState } from "react";
import type { AppWidgetConfig } from "@/types/app-widget";

// ─── Ping hook ────────────────────────────────────────────────────────────────

type PingStatus = "checking" | "online" | "offline";

function usePing(url: string | undefined, intervalSec: number): PingStatus | null {
  const [status, setStatus] = useState<PingStatus>("checking");

  useEffect(() => {
    if (!url) return;
    let alive = true;

    async function check() {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      try {
        await fetch(url!, { method: "HEAD", mode: "no-cors", cache: "no-store", signal: ctrl.signal });
        if (alive) setStatus("online");
      } catch {
        if (alive) setStatus("offline");
      } finally {
        clearTimeout(t);
      }
    }

    setStatus("checking");
    check();
    const id = setInterval(check, intervalSec * 1000);
    return () => { alive = false; clearInterval(id); };
  }, [url, intervalSec]);

  return url ? status : null;
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const PALETTE = [
  "#6d28d9", "#2563eb", "#0284c7", "#059669",
  "#d97706", "#dc2626", "#7c3aed", "#db2777",
];

function seedColor(title: string) {
  return PALETTE[(title.charCodeAt(0) || 65) % PALETTE.length];
}

function Dot({ status }: { status: PingStatus }) {
  const cls =
    status === "checking" ? "bg-white/40 animate-pulse" :
    status === "online"   ? "bg-emerald-400" : "bg-red-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${cls}`} />;
}

function EditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

// ─── Icon atom ────────────────────────────────────────────────────────────────

function AppIcon({ url, title, size = 36 }: { url?: string; title: string; size?: number }) {
  const [err, setErr] = useState(false);
  const dim = { width: size, height: size };
  const style = { ...dim, borderRadius: 8, backgroundColor: seedColor(title), flexShrink: 0 };

  if (!url || err) {
    return (
      <div style={style} className="flex items-center justify-center text-white font-bold text-xs select-none shadow-sm">
        {title.slice(0, 2).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      style={{ ...dim, borderRadius: 8, objectFit: "contain", flexShrink: 0 }}
      onError={() => setErr(true)}
    />
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

interface Props {
  config: AppWidgetConfig;
  onEdit: () => void;
  onClick: () => void;
  fillAxis?: "width" | "height";
}

export default function AppWidget({ config, onEdit, onClick, fillAxis }: Props) {
  const pingUrl = config.ping ? (config.pingUrl || config.url) || undefined : undefined;
  const ping = usePing(pingUrl, config.pingInterval);

  const { logoView, openUrl } = config;
  const [coverErr, setCoverErr] = useState(false);

  const cardW = fillAxis === "width"  ? "100%" : config.width;
  const cardH = fillAxis === "height" ? "100%" : config.height;

  const handleClick = openUrl ? onClick : undefined;
  const cursor = openUrl ? "cursor-pointer" : "cursor-default";
  const tooltip = config.tooltip || undefined;

  const editBtn = (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onEdit(); }}
      className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-md bg-black/30 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/50 hover:text-white transition-all"
    >
      <EditIcon />
    </button>
  );

  // ── Full cover ──────────────────────────────────────────────────────────────
  if (logoView === "full") {
    return (
      <div
        title={tooltip}
        className={`relative group select-none overflow-hidden rounded-2xl border border-white/10 shadow-xl shadow-black/40 ${cursor} transition-all duration-150 hover:border-white/20`}
        style={{ width: cardW, height: cardH }}
        onClick={handleClick}
      >
        {editBtn}

        {config.logoUrl && !coverErr ? (
          <img
            src={config.logoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setCoverErr(true)}
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: seedColor(config.title) }} />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-transparent" />

        <div className="absolute top-0 left-0 right-0 px-3 pt-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] font-semibold text-white leading-tight truncate drop-shadow">
              {config.title || "Untitled"}
            </span>
            {ping !== null && <Dot status={ping} />}
          </div>
          {config.subtitle && (
            <p className="text-[11px] text-white/65 truncate mt-0.5 drop-shadow">{config.subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Icon / None ─────────────────────────────────────────────────────────────
  return (
    <div
      title={tooltip}
      className={`relative group select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-xl shadow-xl shadow-black/30 ${cursor} transition-all duration-150 hover:bg-white/[0.11] hover:border-white/18`}
      style={{ width: cardW, height: cardH }}
      onClick={handleClick}
    >
      {editBtn}

      <div className="flex items-center gap-3 h-full px-4">
        {logoView === "icon" && (
          <AppIcon url={config.logoUrl} title={config.title} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] font-semibold text-white leading-tight truncate">
              {config.title || "Untitled"}
            </span>
            {ping !== null && <Dot status={ping} />}
          </div>
          {config.subtitle && (
            <p className="text-[11px] text-white/50 truncate mt-0.5">{config.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
