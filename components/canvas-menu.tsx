"use client";

import { useEffect, useRef } from "react";

export interface ContextItem {
  label: string;
  onClick: () => void;
}

interface CanvasMenuProps {
  x: number;
  y: number;
  groups: ContextItem[][];
  onDismiss: () => void;
}

export default function CanvasMenu({ x, y, groups, onDismiss }: CanvasMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    }
    window.addEventListener("mousedown", handleDown);
    return () => window.removeEventListener("mousedown", handleDown);
  }, [onDismiss]);

  const allItems = groups.flat();
  const longestLabel = allItems.reduce((max, item) => Math.max(max, item.label.length), 0);
  const menuW = Math.max(200, Math.min(320, longestLabel * 7 + 48));
  const menuH = allItems.length * 36 + (groups.length - 1) * 5 + 8;

  const left = x + menuW > window.innerWidth  ? x - menuW : x;
  const top  = y + menuH > window.innerHeight ? y - menuH : y;

  return (
    <div
      ref={ref}
      className="absolute z-30 bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1"
      style={{ left, top, width: menuW }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="my-1 border-t border-white/[0.06]" />}
          {group.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
              onClick={() => { item.onClick(); onDismiss(); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
