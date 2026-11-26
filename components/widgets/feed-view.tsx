"use client";

import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import type { AppFeedConfig, FeedColumn, FeedFilterButton } from "@/types/feed";
import { isSafeLink, isWebUrl } from "@/lib/feed/links";
import {
  buttonId,
  countMatches,
  fillTemplate,
  focusFilter,
  getPath,
  parseCss,
  resolveStyle,
  toggleFilter,
  toText,
  visibleRows,
} from "@/lib/feed/view";

/**
 * Renders a feed's rows. Every value from the data goes into the page as a
 * React text node, or as a link/image URL that must be http(s). Admin-written
 * CSS only ever becomes one element's inline style.
 */

const TINTED: CSSProperties = {
  display: "inline-block",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 10,
  lineHeight: "14px",
  border: "1px solid color-mix(in srgb, currentColor 35%, transparent)",
  background: "color-mix(in srgb, currentColor 15%, transparent)",
  whiteSpace: "nowrap",
};

const LINK_REL = "noopener noreferrer nofollow";

function css(style: Record<string, string>): CSSProperties {
  return style as CSSProperties;
}

function Progress({ value, style }: { value: unknown; style: CSSProperties }) {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return <span>–</span>;
  const pct = Math.round(Math.min(100, Math.max(0, n)));
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-[5px] rounded-full bg-white/[0.12] overflow-hidden">
        <div className="h-full rounded-full bg-sky-400" style={{ ...style, width: `${pct}%` }} />
      </div>
      <span className="w-[30px] text-right tabular-nums">{pct}%</span>
    </div>
  );
}

function MainValue({ column, row }: { column: FeedColumn; row: unknown }) {
  const value = getPath(row, column.key);
  const style = css(resolveStyle(column.style, row));
  switch (column.type) {
    case "link": {
      const href = getPath(row, column.hrefKey ?? "");
      const text = toText(value);
      return isWebUrl(href) ? (
        <a href={href} target="_blank" rel={LINK_REL} className="font-medium hover:underline" style={style}>
          {text}
        </a>
      ) : (
        <span className="font-medium" style={style}>{text}</span>
      );
    }
    case "image":
      return isWebUrl(value) ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote feed images
        <img src={value} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ height: 32, borderRadius: 3, display: "block", ...style }} />
      ) : null;
    case "progress":
      return <Progress value={value} style={style} />;
    case "badge":
      return toText(value) ? <span data-badge="" style={{ ...TINTED, color: "#a1a1aa", ...style }}>{toText(value)}</span> : null;
    default:
      return <span style={style}>{toText(value)}</span>;
  }
}

function Cell({ column, row }: { column: FeedColumn; row: unknown }) {
  const sub = column.subKey ? toText(getPath(row, column.subKey)) : "";
  const subStyle = css(resolveStyle(column.subStyle, row));
  const beside = column.subDirection === "beside";
  // Beside: the sub value sits next to the main one when it fits and wraps
  // below it when it doesn't, so neither gets cut off.
  return (
    <td className="px-1.5 py-[5px] border-t border-white/[0.08] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
      <div className={beside ? "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0" : "min-w-0"} data-sub={beside ? "beside" : "below"}>
        <div className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
          <MainValue column={column} row={row} />
        </div>
        {sub && (
          <div className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-zinc-400" style={subStyle} title={sub}>
            {sub}
          </div>
        )}
      </div>
    </td>
  );
}

interface FilterBarProps {
  buttons: readonly FeedFilterButton[];
  rows: readonly unknown[];
  active: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
  style: CSSProperties;
}

function FilterBar({ buttons, rows, active, onToggle, onFocus, style }: FilterBarProps) {
  const filtering = buttons.some((b) => active.has(buttonId(b)));
  return (
    <div className="shrink-0 flex flex-wrap gap-1.5 px-3 py-2 border-b border-white/10" style={style}>
      {buttons.map((button) => {
        const id = buttonId(button);
        const on = active.has(id);
        const label = button.showCount ? `${countMatches(rows, button)} ${button.label}` : button.label;
        return (
          <button
            key={id}
            type="button"
            data-filter-button=""
            aria-pressed={on}
            title="Click to toggle, double-click to show only this"
            onClick={(e: MouseEvent) => { e.stopPropagation(); onToggle(id); }}
            onDoubleClick={(e: MouseEvent) => { e.stopPropagation(); onFocus(id); }}
            className="cursor-pointer select-none transition-opacity"
            style={{
              ...TINTED,
              color: "#a1a1aa",
              ...css(parseCss(button.style)),
              opacity: filtering && !on ? 0.4 : 1,
              outline: on ? "1px solid currentColor" : "none",
              outlineOffset: 1,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Click/Enter on a row opens its row link in a new tab. Clicks on a link
 * inside the row, or that end a text selection, are left alone.
 */
function rowLinkProps(href: string | null) {
  if (!href) return {};
  const open = () => window.open(href, "_blank", "noopener,noreferrer");
  return {
    role: "link",
    tabIndex: 0,
    "data-row-link": href,
    className: "cursor-pointer hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-1 focus-visible:outline-sky-400/60",
    onClick: (e: MouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest("a")) return;
      if (window.getSelection()?.toString()) return;
      open();
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" && e.target === e.currentTarget) open();
    },
  };
}

function SimpleList({ rows, rowLink }: { rows: readonly unknown[]; rowLink: string }) {
  return (
    <ul className="divide-y divide-white/[0.04]">
      {rows.map((item, i) => {
        const title = toText(getPath(item, "title") ?? getPath(item, "name") ?? getPath(item, "label") ?? item);
        const subtitle = toText(getPath(item, "subtitle") ?? getPath(item, "status") ?? getPath(item, "description"));
        const href = getPath(item, "url") ?? getPath(item, "link");
        return (
          <li key={i} {...rowLinkProps(fillTemplate(rowLink, item))}>
            <div className="px-3 py-2">
            <p className="text-xs text-zinc-200 truncate">
              {isSafeLink(href) ? (
                <a href={href} target="_blank" rel={LINK_REL} className="hover:underline hover:text-sky-200">{title}</a>
              ) : title}
            </p>
            {subtitle && <p className="text-[10px] text-zinc-500 truncate mt-0.5">{subtitle}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface Props {
  feed: AppFeedConfig;
  rows: readonly unknown[];
}

export default function FeedView({ feed, rows }: Props) {
  const [active, setActive] = useState<ReadonlySet<string>>(() => new Set());
  const { columns, filterButtons, styles, rowLink } = feed;
  const shown = visibleRows(rows, filterButtons, active);

  return (
    <div className="w-full h-full flex flex-col text-[11px] text-zinc-100" style={css(parseCss(styles.panel))}>
      {filterButtons.length > 0 && (
        <FilterBar
          buttons={filterButtons}
          rows={rows}
          active={active}
          onToggle={(id) => setActive((prev) => toggleFilter(prev, id))}
          onFocus={(id) => setActive((prev) => focusFilter(prev, id))}
          style={css(parseCss(styles.filterBar))}
        />
      )}
      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 [scrollbar-width:thin]">
        {rows.length === 0 ? (
          <p className="p-3 text-xs text-zinc-500">No items.</p>
        ) : shown.length === 0 ? (
          <p className="p-3 text-xs text-zinc-500">Nothing matches the selected filters.</p>
        ) : columns.length === 0 ? (
          <SimpleList rows={shown} rowLink={rowLink} />
        ) : (
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr style={css(parseCss(styles.header))}>
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className="sticky top-0 bg-zinc-950/90 px-1.5 py-1.5 text-left text-[9px] font-medium uppercase text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ width: c.width || undefined }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, r) => (
                <tr key={r} style={css(resolveStyle(styles.row, row))} {...rowLinkProps(fillTemplate(rowLink, row))}>
                  {columns.map((c, i) => <Cell key={i} column={c} row={row} />)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
