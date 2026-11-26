/**
 * A feed is a list. The server runs Get(url) and then each step in order:
 *
 *   Get(url).transform(f).map(f).filter(f) ...
 *
 * The browser shows the resulting rows as columns, with optional filter
 * buttons above them. Values are always rendered as text (or as a checked
 * link/image URL), never as HTML, so data from the source app can't inject
 * markup or scripts into the dashboard.
 */

export type FeedMethod = "none" | "GET";

export interface FeedHeaderRow {
  key: string;
  value: string;
}

/**
 * - transform: receives the previous output (the raw body for the first step)
 *   and returns a list.
 * - map: called for each row, returns the new row.
 * - filter: called for each row, keeps it when it returns something truthy.
 *
 * `code` evaluates to a function. Inside it, `get(path)` fetches a path on the
 * Get URL's host with the Get's headers and returns the parsed JSON (or null).
 */
export type FeedStepKind = "transform" | "map" | "filter";

export interface FeedStep {
  kind: FeedStepKind;
  code: string;
}

/** One `switch` case: when the row's switch key equals `equals`, add `style`. */
export interface StyleCase {
  equals: string;
  style: string;
}

/**
 * Inline CSS for one element. `base` always applies; when `switchKey` is set,
 * the first case whose `equals` matches the row's value at that key is added
 * on top. Values from the data never go into CSS, only this admin-written text.
 */
export interface StyleRule {
  base: string;
  switchKey?: string;
  cases?: StyleCase[];
}

export type FeedColumnType = "text" | "link" | "image" | "progress" | "badge";
export type SubDirection = "below" | "beside";

export interface FeedColumn {
  /** Column header text. */
  label: string;
  type: FeedColumnType;
  /** Row path of the main value, e.g. `title` or `media.status`. Empty = the row itself. */
  key: string;
  /** Optional second value shown with the main one. */
  subKey?: string;
  subDirection?: SubDirection;
  /** Link columns: row path of the URL to open. */
  hrefKey?: string;
  /** CSS width of the column, e.g. `30%` or `48px`. */
  width?: string;
  style?: StyleRule;
  subStyle?: StyleRule;
}

/**
 * A toggle above the list. On: show rows whose `key` equals `equals`. Several
 * on: rows matching any of them. Double-click: show only this one.
 */
export interface FeedFilterButton {
  label: string;
  key: string;
  equals: string;
  /** Prefix the label with how many rows match, e.g. "2 pending". */
  showCount?: boolean;
  style?: string;
}

/** Styles for the feed panel itself. */
export interface FeedStyles {
  panel?: string;
  filterBar?: string;
  header?: string;
  row?: StyleRule;
}

export interface AppFeedConfig {
  method: FeedMethod;
  url: string;
  headers: FeedHeaderRow[];
  steps: FeedStep[];
  columns: FeedColumn[];
  filterButtons: FeedFilterButton[];
  styles: FeedStyles;
  pollInterval: number;
  /** Panel height in px, or any CSS length such as `calc(100% - 73px)`. */
  height: number | string;
  /**
   * URL template that makes each row open its own page, e.g.
   * `http://sonarr.test/series/{titleSlug}`. `{key}` and `{{key}}` both work.
   * Empty = rows are not clickable.
   */
  rowLink: string;
}

export const DEFAULT_FEED_CONFIG: AppFeedConfig = {
  method: "none",
  url: "",
  headers: [],
  steps: [],
  columns: [],
  filterButtons: [],
  styles: {},
  pollInterval: 30,
  height: 200,
  rowLink: "",
};
