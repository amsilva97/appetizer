"use client";

import { useEffect, useRef, useState } from "react";
import type { FeedWidgetConfig } from "@/types/feed-widget";

type FeedStatus = "idle" | "loading" | "ok" | "error";

function useFeed(config: FeedWidgetConfig) {
  const [data, setData] = useState<unknown[]>([]);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const { connection, pollInterval } = config;
    if (connection.method === "none") return;

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
          body: JSON.stringify({
            url: connection.url,
            headers: Object.fromEntries(
              connection.headers
                .filter((h) => h.key.trim())
                .map((h) => [h.key, h.value])
            ),
            transform: connection.transform || undefined,
          }),
          signal: ctrl.signal,
        });

        const json = (await res.json()) as { data?: unknown[]; error?: string };
        if (!res.ok || json.error) {
          setStatus("error");
          setErrorMsg(json.error ?? "Unknown error");
        } else {
          setData(json.data ?? []);
          setStatus("ok");
          setErrorMsg(null);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setStatus("error");
          setErrorMsg("Request failed");
        }
      }
    }

    poll();
    const id = setInterval(poll, Math.max(pollInterval, 10) * 1000);
    document.addEventListener("visibilitychange", poll);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", poll);
      abortRef.current?.abort();
    };
  }, [config]);

  return { data, status, errorMsg };
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

interface Props {
  config: FeedWidgetConfig;
}

export default function FeedWidget({ config }: Props) {
  const { data, status, errorMsg } = useFeed(config);
  const { width, height, borderRadius, label, connection } = config;

  return (
    <div
      style={{ width, height, borderRadius }}
      className="bg-zinc-900 border border-white/[0.06] overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold text-zinc-300 truncate">{label}</span>
        <span className="text-zinc-600 shrink-0 ml-2">
          {status === "loading" && <SpinnerIcon />}
          {status === "error" && <span className="text-xs text-red-400">Error</span>}
          {status === "ok" && <span className="text-[10px] text-zinc-600">{data.length} items</span>}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {connection.method === "none" && (
          <p className="p-3 text-xs text-zinc-600">No feed configured.</p>
        )}
        {status === "error" && (
          <p className="p-3 text-xs text-red-400">{errorMsg}</p>
        )}
        {status === "ok" && data.length === 0 && (
          <p className="p-3 text-xs text-zinc-600">No items.</p>
        )}
        {status === "ok" && data.length > 0 && (
          <ul className="divide-y divide-white/[0.04]">
            {data.map((item, i) => {
              const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
              const title = obj ? renderValue(obj.title ?? obj.name ?? obj.label) : renderValue(item);
              const subtitle = obj ? renderValue(obj.subtitle ?? obj.status ?? obj.description ?? "") : "";
              return (
                <li key={i} className="px-3 py-2">
                  <p className="text-xs text-zinc-200 truncate">{title || JSON.stringify(item)}</p>
                  {subtitle && <p className="text-[10px] text-zinc-500 truncate mt-0.5">{subtitle}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
