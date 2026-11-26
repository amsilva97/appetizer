import {
  DEFAULT_FEED_CONFIG,
  type AppFeedConfig,
  type FeedColumn,
  type FeedColumnType,
  type FeedFilterButton,
  type FeedHeaderRow,
  type FeedStep,
  type FeedStepKind,
  type FeedStyles,
} from "@/types/feed";

const STEP_KINDS: readonly FeedStepKind[] = ["transform", "map", "filter"];
const COLUMN_TYPES: readonly FeedColumnType[] = ["text", "link", "image", "progress", "badge"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function normalizeStep(raw: Record<string, unknown>): FeedStep | null {
  const kind = raw.kind as FeedStepKind;
  return STEP_KINDS.includes(kind) ? { kind, code: str(raw.code) } : null;
}

function normalizeHeader(raw: Record<string, unknown>): FeedHeaderRow | null {
  return typeof raw.key === "string" ? { key: raw.key, value: str(raw.value) } : null;
}

function normalizeColumn(raw: Record<string, unknown>): FeedColumn {
  const type = COLUMN_TYPES.includes(raw.type as FeedColumnType) ? (raw.type as FeedColumnType) : "text";
  return { ...raw, label: str(raw.label), key: str(raw.key), type } as FeedColumn;
}

function normalizeButton(raw: Record<string, unknown>): FeedFilterButton | null {
  if (raw.key === undefined || raw.equals === undefined) return null;
  return { ...raw, label: str(raw.label), key: str(raw.key), equals: str(raw.equals) } as FeedFilterButton;
}

/**
 * Feeds from before steps had one `transform` expression that read `body`.
 * Run it as the first transform step, evaluated the same way it used to be.
 */
function legacySteps(transform: unknown): FeedStep[] {
  if (typeof transform !== "string" || !transform.trim()) return [];
  return [{ kind: "transform", code: `body => eval(${JSON.stringify(transform)})` }];
}

/**
 * Turn whatever is saved (or half-typed in the YAML tab) into a complete feed
 * config. Malformed list entries are dropped instead of failing the widget.
 */
export function normalizeFeed(value: unknown): AppFeedConfig {
  if (!isRecord(value)) return { ...DEFAULT_FEED_CONFIG };
  const rest = Object.fromEntries(
    Object.entries(value).filter(([k]) => k !== "transform" && k !== "lookups")
  );
  const steps = Array.isArray(value.steps)
    ? records(value.steps).map(normalizeStep).filter((s): s is FeedStep => s !== null)
    : legacySteps(value.transform);

  return {
    ...DEFAULT_FEED_CONFIG,
    ...rest,
    method: value.method === "GET" ? "GET" : "none",
    url: str(value.url),
    headers: records(value.headers).map(normalizeHeader).filter((h): h is FeedHeaderRow => h !== null),
    steps,
    columns: records(value.columns).map(normalizeColumn),
    filterButtons: records(value.filterButtons)
      .map(normalizeButton)
      .filter((b): b is FeedFilterButton => b !== null),
    styles: isRecord(value.styles) ? (value.styles as FeedStyles) : {},
  } as AppFeedConfig;
}
