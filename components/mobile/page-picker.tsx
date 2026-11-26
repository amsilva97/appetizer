"use client";

import { useEffect, useRef, useState } from "react";
import type { PageMeta } from "@/types/permissions";

interface Props {
  pages: PageMeta[];
  currentPage?: string;
  onPick: (name: string) => void;
  color: string;
  activeColor: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** The phone toolbar's page name. With more than one page, tapping it lists the pages to jump to. */
export default function PagePicker({ pages, currentPage, onPick, color, activeColor }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = pages.find((p) => p.name === currentPage)?.label ?? "";
  const canPick = pages.length > 1;

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (!canPick) {
    return <span className="text-sm font-semibold truncate" style={{ color: activeColor }}>{label}</span>;
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-9 px-3 max-w-full rounded-lg active:bg-white/[0.08]"
        style={{ color: activeColor }}
      >
        <span className="text-sm font-semibold truncate">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Pages"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-44 max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-1 z-30"
        >
          {pages.map((p) => {
            const active = p.name === currentPage;
            return (
              <li key={p.name} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); if (!active) onPick(p.name); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${active ? "bg-white/[0.08] font-semibold" : "active:bg-white/[0.06]"}`}
                  style={{ color: active ? activeColor : color }}
                >
                  {p.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
