import type { AppFeedConfig, FeedFilterButton, StyleRule } from "@/types/feed";
import { isWebUrl } from "@/lib/feed/links";

/** Fields the simple list (a feed with no columns) shows. */
export const SIMPLE_LIST_KEYS = ["title", "name", "label", "subtitle", "status", "description", "url", "link"];

type Path = readonly string[];

/** Path parts that would reach an object's prototype instead of its data. */
const UNSAFE_PARTS = new Set(["__proto__", "constructor", "prototype"]);

function split(path: string): Path {
  return path ? path.split(".") : [];
}

function isSafePath(parts: Path): boolean {
  return parts.every((p) => !UNSAFE_PARTS.has(p));
}

/** Value at a dotted path such as `media.status` or `seasons.0.number`. Empty path = the row. */
export function getPath(row: unknown, path: string): unknown {
  const parts = split(path);
  if (!isSafePath(parts)) return undefined;
  let current: unknown = row;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** A value as display text. Never HTML: React renders it as a text node. */
export function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function camel(prop: string): string {
  return prop.startsWith("--") ? prop : prop.toLowerCase().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Admin-written CSS declarations ("color: red; font-size: 10px") as a React
 * style object. It only ever becomes one element's inline style, so it can't
 * restyle anything outside the feed.
 */
export function parseCss(css: string | undefined): Record<string, string> {
  const style: Record<string, string> = {};
  for (const decl of (css ?? "").split(";")) {
    const colon = decl.indexOf(":");
    if (colon <= 0) continue;
    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (prop && value) style[camel(prop)] = value;
  }
  return style;
}

/** Base CSS plus the first `switch` case matching the row, as a style object. */
export function resolveStyle(rule: StyleRule | undefined, row: unknown): Record<string, string> {
  if (!rule) return {};
  const base = parseCss(rule.base);
  if (!rule.switchKey) return base;
  const value = toText(getPath(row, rule.switchKey));
  const match = (rule.cases ?? []).find((c) => c.equals === value);
  return match ? { ...base, ...parseCss(match.style) } : base;
}

// ─── Filter buttons ───────────────────────────────────────────────────────────

/** Stable id for a button, so the selection survives edits to its label or order. */
export function buttonId(button: FeedFilterButton): string {
  return `${button.key}=${button.equals}`;
}

function matches(row: unknown, button: FeedFilterButton): boolean {
  return toText(getPath(row, button.key)) === button.equals;
}

export function countMatches(rows: readonly unknown[], button: FeedFilterButton): number {
  return rows.filter((row) => matches(row, button)).length;
}

/** Selection with `id` flipped. Returns a new set. */
export function toggleFilter(active: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(active);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Only `id` selected; if it already was the only one, nothing selected. */
export function focusFilter(active: ReadonlySet<string>, id: string): Set<string> {
  return active.size === 1 && active.has(id) ? new Set() : new Set([id]);
}

/**
 * Rows to show. Nothing selected shows everything; otherwise rows matching any
 * selected button. Selected ids with no button any more are ignored, so the
 * list can't go blank with nothing left to click.
 */
export function visibleRows<T>(
  rows: readonly T[],
  buttons: readonly FeedFilterButton[],
  active: ReadonlySet<string>
): T[] {
  const selected = buttons.filter((b) => active.has(buttonId(b)));
  if (selected.length === 0) return [...rows];
  return rows.filter((row) => selected.some((b) => matches(row, b)));
}

// ─── Trimming rows before they leave the server ───────────────────────────────

// {{key}} or {key}; keys are row paths like `id` or `media.tmdbId`.
const PLACEHOLDER = /\{\{\s*([^{}\s]+)\s*\}\}|\{\s*([^{}\s]+)\s*\}/g;

/** The row paths a URL template reads. */
export function templateKeys(template: string | undefined): string[] {
  return [...(template ?? "").matchAll(PLACEHOLDER)].map((m) => m[1] ?? m[2]);
}

/**
 * Fill a URL template from a row. Values are URL-encoded, except when the
 * template is a single placeholder (`{url}`), where the value is the URL.
 * Returns null when a key has no value or the result isn't an http(s) URL.
 */
export function fillTemplate(template: string | undefined, row: unknown): string | null {
  const t = (template ?? "").trim();
  if (!t) return null;
  const keys = templateKeys(t);
  const values = keys.map((k) => toText(getPath(row, k)));
  if (values.some((v) => v === "")) return null;
  const whole = keys.length === 1 && t.replace(PLACEHOLDER, "") === "";
  let i = 0;
  const url = whole ? values[0] : t.replace(PLACEHOLDER, () => encodeURIComponent(values[i++]));
  return isWebUrl(url) ? url : null;
}

function ruleKeys(rule: StyleRule | undefined): string[] {
  return rule?.switchKey ? [rule.switchKey] : [];
}

/** Every row path the display reads, so the server can send only those. */
export function usedPaths(feed: AppFeedConfig): Set<string> {
  if (feed.columns.length === 0) return new Set([...SIMPLE_LIST_KEYS, ...templateKeys(feed.rowLink)]);
  const paths = [
    ...feed.columns.flatMap((c) => [
      c.key,
      c.subKey ?? "",
      c.type === "link" ? c.hrefKey ?? "" : "",
      ...ruleKeys(c.style),
      ...ruleKeys(c.subStyle),
    ]),
    ...feed.filterButtons.map((b) => b.key),
    ...ruleKeys(feed.styles.row),
    ...templateKeys(feed.rowLink),
  ];
  // An empty key means "the whole row"; keep it only when a column asks for that.
  const wholeRow = feed.columns.some((c) => c.key === "" || c.subKey === "");
  return new Set(paths.filter((p) => p !== "" || wholeRow));
}

function setPath(target: Record<string, unknown>, source: unknown, parts: Path): void {
  const [head, ...rest] = parts;
  if (source === null || typeof source !== "object" || !(head in (source as object))) return;
  const value = (source as Record<string, unknown>)[head];
  if (rest.length === 0) {
    target[head] = value;
    return;
  }
  if (value === null || typeof value !== "object") return;
  const child = (target[head] ??= Array.isArray(value) ? [] : {}) as Record<string, unknown>;
  setPath(child, value, rest);
}

/** A copy of `row` holding only `paths`. An empty path keeps the whole row. */
export function pickPaths(row: unknown, paths: Iterable<string>): unknown {
  const list = [...paths];
  if (list.includes("") || row === null || typeof row !== "object") return row;
  const out: Record<string, unknown> = Array.isArray(row) ? ([] as unknown as Record<string, unknown>) : {};
  for (const path of list) {
    const parts = split(path);
    if (isSafePath(parts)) setPath(out, row, parts);
  }
  return out;
}
