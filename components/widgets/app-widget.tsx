"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { resolveAppPadding, type AppWidgetConfig, type AppFeedConfig } from "@/types/app-widget";
import { resolveSpacing, spacingCss } from "@/types/spacing";
import { normalizeFeed } from "@/lib/feed/normalize";
import FeedView from "@/components/widgets/feed-view";
import { useCurrentPage } from "@/lib/page-context";
import CoverImage from "@/components/widgets/cover-image";

// ─── Ping hook ────────────────────────────────────────────────────────────────

type PingStatus = "checking" | "online" | "offline";

function usePing(url: string | undefined, intervalSec: number): PingStatus | null {
  // Results are tagged with the url they're for, so a new url reads as
  // "checking" until its first answer, without resetting state in the effect.
  const [result, setResult] = useState<{ url: string; status: PingStatus } | null>(null);

  useEffect(() => {
    if (!url) return;
    let alive = true;

    async function check() {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      try {
        await fetch(url!, { method: "HEAD", mode: "no-cors", cache: "no-store", signal: ctrl.signal });
        if (alive) setResult({ url: url!, status: "online" });
      } catch {
        if (alive) setResult({ url: url!, status: "offline" });
      } finally {
        clearTimeout(t);
      }
    }

    check();
    const id = setInterval(check, intervalSec * 1000);
    return () => { alive = false; clearInterval(id); };
  }, [url, intervalSec]);

  if (!url) return null;
  return result?.url === url ? result.status : "checking";
}

// ─── Feed hook ─────────────────────────────────────────────────────────────────

type FeedStatus = "idle" | "loading" | "ok" | "error";

interface FeedRef {
  page: string;
  widgetId?: string;
}

function useFeed(feed: AppFeedConfig | null, { page, widgetId }: FeedRef) {
  const [data, setData] = useState<unknown[]>([]);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!feed || feed.method === "none") return;

    async function poll() {
      if (document.visibilityState === "hidden") return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStatus("loading");
      try {
        const res = await fetch("/api/feed/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Viewers get the feed saved on page/widgetId; the server only uses
          // the live config below for layout editors (pages:update).
          body: JSON.stringify({ page, widgetId, feed }),
          signal: ctrl.signal,
        });
        const json = (await res.json()) as { data?: unknown[]; error?: string };
        if (!res.ok || json.error) {
          setError(json.error ?? `HTTP ${res.status}`);
          setStatus("error");
        } else {
          setHasLoaded(true);
          setData(Array.isArray(json.data) ? json.data : []);
          setError("");
          setStatus("ok");
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Couldn't reach Appetizer");
          setStatus("error");
        }
      }
    }

    poll();
    const id = setInterval(poll, Math.max(feed.pollInterval, 10) * 1000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
      abortRef.current?.abort();
    };
  }, [feed, page, widgetId]);

  return { data, status, hasLoaded, error };
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

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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
  /** Saved widget id; lets non-admin viewers load the widget's feed. */
  widgetId?: string;
  onClick: () => void;
  /** Stretch the card to its container on this axis ("both" for carousel slots). */
  fillAxis?: "width" | "height" | "both";
}

/** Let links inside the feed open on their own instead of also opening the card's app. */
function stopLinkClicks(e: MouseEvent): void {
  if ((e.target as HTMLElement).closest("a[href]")) e.stopPropagation();
}

export default function AppWidget({ config, widgetId, onClick, fillAxis }: Props) {
  const page = useCurrentPage();
  const pingUrl = config.ping ? (config.pingUrl || config.url) || undefined : undefined;
  const ping = usePing(pingUrl, config.pingInterval);
  const feed = useMemo(() => (config.feed ? normalizeFeed(config.feed) : null), [config.feed]);
  const { data: feedData, status: feedStatus, hasLoaded: feedHasLoaded, error: feedError } = useFeed(feed, { page, widgetId });

  const { logoView, openUrl } = config;
  const [coverErr, setCoverErr] = useState(false);

  const margin = resolveSpacing(config.margin, 0);
  const padding = resolveAppPadding(config.padding);
  // Older cards saved one padding number; the cover title used it on every side.
  const coverTop = typeof config.padding === "number" ? config.padding : padding.top;
  const borderRadius = config.borderRadius ?? 16;
  const iconTransform = `scale(${config.iconZoom ?? 1}) translate(${config.iconOffsetX ?? 0}%, ${config.iconOffsetY ?? 0}%)`;

  const hasActiveFeed = feed?.method === "GET";
  const feedHeight = feed?.height ?? 200;

  const fillW = fillAxis === "width" || fillAxis === "both";
  const fillH = fillAxis === "height" || fillAxis === "both";

  const cardW = fillW
    ? `calc(100% - ${margin.left + margin.right}px)`
    : config.width;

  const cardH = fillH
    ? `calc(100% - ${margin.top + margin.bottom}px)`
    : hasActiveFeed ? undefined : config.height + padding.top + padding.bottom;

  const handleClick = openUrl ? onClick : undefined;
  const cursor = openUrl ? "cursor-pointer" : "cursor-default";
  const tooltip = config.tooltip || undefined;

  const cardStyle = { width: cardW, height: cardH, margin: spacingCss(margin), borderRadius, flexShrink: 0 };

  // ── Full cover ──────────────────────────────────────────────────────────────
  if (logoView === "full") {
    return (
      <div
        title={tooltip}
        className={`relative select-none overflow-hidden border border-white/10 shadow-xl shadow-black/40 ${cursor} transition-all duration-150 hover:border-white/20`}
        style={{ ...cardStyle, height: fillH ? cardH : config.height }}
        onClick={handleClick}
      >
        {config.logoUrl && !coverErr ? (
          <CoverImage
            src={config.logoUrl}
            fit={config.coverFit ?? "cover"}
            transform={iconTransform}
            onError={() => setCoverErr(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: seedColor(config.title), transform: iconTransform, transformOrigin: "center" }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-transparent" />

        <div className="absolute top-0 left-0 right-0" style={{ paddingTop: coverTop, paddingRight: padding.right, paddingLeft: padding.left }}>
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
      className={`relative select-none overflow-hidden border border-white/10 bg-white/[0.07] backdrop-blur-xl shadow-xl shadow-black/30 flex flex-col ${cursor} transition-all duration-150 hover:bg-white/[0.11] hover:border-white/18`}
      style={cardStyle}
      onClick={handleClick}
    >
      {/* App header row */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          height: config.height,
          boxSizing: "content-box",
          paddingTop: padding.top,
          paddingRight: padding.right,
          paddingBottom: padding.bottom,
          paddingLeft: padding.left,
        }}
      >
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

        {hasActiveFeed && feedStatus === "loading" && (
          <span className="text-zinc-600 shrink-0"><SpinnerIcon /></span>
        )}
      </div>

      {/* Feed section — overflow hidden so % sizing resolves inside */}
      {hasActiveFeed && (
        <div
          className="border-t border-white/[0.08] overflow-hidden relative"
          style={{ height: feedHeight }}
          onClick={stopLinkClicks}
        >
          {feedStatus === "error" && (
            <p className="p-3 text-xs text-red-400 break-words">Failed to load feed{feedError ? `: ${feedError}` : "."}</p>
          )}
          {feed && (feedStatus === "ok" || (feedStatus === "loading" && feedHasLoaded)) && (
            <FeedView feed={feed} rows={feedData} />
          )}
        </div>
      )}
    </div>
  );
}
