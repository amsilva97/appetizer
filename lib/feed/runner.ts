import vm from "node:vm";
import { types } from "node:util";
import { substituteKeys } from "@/lib/auth/keys";
import type { FeedStepKind } from "@/types/feed";

const MAX_BODY_BYTES = 10 * 1024 * 1024;
const MAX_ERROR_CHARS = 500;
/** Longest a single step may run before it's stopped. */
export const STEP_TIMEOUT_MS = 2000;
/** Most get() requests in flight at once, to stay polite to the source app. */
const MAX_PARALLEL_GETS = 8;

export function substituteHeaders(
  headers: Record<string, string>,
  keys: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    result[k] = substituteKeys(v, keys);
  }
  return result;
}

/**
 * Runs inside the sandbox. Everything the step could hook (its own code,
 * getters, toJSON, error messages) happens in this one call, under the
 * timeout. It hands back a plain JSON string:
 *   {"value": ...}     the step's output
 *   {"pending": [...]} paths get() asked for that haven't been fetched yet
 *   {"error": "..."}
 * Built-ins are captured before the step runs so it can't swap them out.
 *
 * get(path) returns a fresh copy of already-fetched data. For anything not
 * fetched yet it records the path and throws a private marker, which the
 * per-row loop catches, so one pass collects every row's requests. The host
 * fetches them and runs the step again.
 */
const WRAPPER = new vm.Script(`(function (kind, src, input, cacheInput) {
  "use strict";
  var parse = JSON.parse, stringify = JSON.stringify, toStr = String, isArray = Array.isArray;
  var has = Object.prototype.hasOwnProperty;
  var FAIL = '{"error":"Step error"}';
  var cache = parse(cacheInput), PENDING = {}, wanted = [], seen = {};

  globalThis.get = function (path) {
    path = toStr(path);
    if (has.call(cache, path)) return parse(cache[path]);
    if (!has.call(seen, path)) { seen[path] = true; wanted.push(path); }
    throw PENDING;
  };

  function message(e) {
    try { return toStr(e !== null && typeof e === "object" && "message" in e ? e.message : e); }
    catch (_) { return "Step error"; }
  }
  function isThenable(v) {
    return v !== null && (typeof v === "object" || typeof v === "function") && typeof v.then === "function";
  }

  var out;
  try {
    var fn = (0, eval)(src);
    if (typeof fn !== "function") return stringify({ error: "The code must evaluate to a function, e.g. row => row" });
    var data = parse(input);

    if (kind === "transform") {
      try { out = fn(data); }
      catch (e) { if (e !== PENDING) throw e; }
    } else {
      if (!isArray(data)) return stringify({ error: "This step needs a list. Add a transform step that returns one first." });
      out = [];
      for (var i = 0; i < data.length; i++) {
        var r;
        try { r = fn(data[i], i); }
        catch (e) {
          if (e === PENDING) continue;
          return stringify({ error: "row " + (i + 1) + ": " + message(e) });
        }
        if (isThenable(r)) return stringify({ error: "Steps can't be async: get() returns data directly, no await needed" });
        if (kind === "map") out.push(r);
        else if (r) out.push(data[i]);
      }
    }
  } catch (e) {
    return stringify({ error: message(e) });
  }

  if (wanted.length) return stringify({ pending: wanted });
  if (isThenable(out)) return stringify({ error: "Steps can't be async: get() returns data directly, no await needed" });
  if (!isArray(out)) return stringify({ error: "A transform must return a list (an array)" });
  try { return stringify({ value: out }); } catch (_) { return FAIL; }
})(__kind, __src, __input, __cache)`);

export type StepResult = { value: unknown[] } | { pending: string[] };

/**
 * Run one feed step in its own JS realm.
 *
 * node:vm is only safe while no host object is reachable from inside: a host
 * object's constructor chain leads to the host's Function and from there to
 * `process`. So only strings cross the boundary, both ways: the input and the
 * fetched data go in as JSON, and the result comes back as a JSON string.
 * Only admins can author steps.
 *
 * `cache` maps each path get() may ask for to its fetched JSON.
 */
export function runStep(
  kind: FeedStepKind,
  code: string,
  input: unknown,
  cache: Readonly<Record<string, string>>,
  timeoutMs: number = STEP_TIMEOUT_MS
): StepResult {
  const context = vm.createContext(Object.create(null), {
    codeGeneration: { strings: true, wasm: false },
    microtaskMode: "afterEvaluate",
  });
  // Set before any step code exists in this realm, so no setter can intercept them.
  context.__kind = kind;
  context.__src = code;
  context.__input = JSON.stringify(input ?? null);
  context.__cache = JSON.stringify(cache);

  let out: unknown;
  try {
    out = WRAPPER.runInContext(context, { timeout: Math.max(1, timeoutMs) });
  } catch (err) {
    throw new Error(safeMessage(err));
  }

  if (typeof out !== "string") throw new Error("Step returned nothing");
  const parsed = JSON.parse(out) as { value?: unknown[]; pending?: string[]; error?: string };
  if (typeof parsed.error === "string") throw new Error(parsed.error.slice(0, MAX_ERROR_CHARS));
  if (Array.isArray(parsed.pending)) return { pending: parsed.pending.map(String) };
  return { value: Array.isArray(parsed.value) ? parsed.value : [] };
}

/**
 * Read a message from something thrown, without running any code it carries:
 * proxies are skipped and only plain data properties are read.
 */
function safeMessage(err: unknown): string {
  if (typeof err !== "object" || err === null || types.isProxy(err)) return "Step error";
  const desc = Object.getOwnPropertyDescriptor(err, "message");
  return desc && "value" in desc && typeof desc.value === "string"
    ? desc.value.slice(0, MAX_ERROR_CHARS)
    : "Step error";
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  requireOk: boolean
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (requireOk && !res.ok) throw new Error(`Upstream returned ${res.status}`);

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      throw new Error("Response too large");
    }
    const text = await res.text();
    if (text.length > MAX_BODY_BYTES) throw new Error("Response too large");
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The feed's main GET. Throws on a network error or a non-JSON body. A JSON
 * body with an error status still goes to the steps, since some status APIs
 * report "down" that way.
 */
export function fetchFeed(url: string, headers: Record<string, string>, timeoutMs: number): Promise<unknown> {
  return fetchJson(url, headers, timeoutMs, false);
}

/**
 * Fetch get() URLs with the feed's headers, a few at a time. One that fails,
 * returns an error status or isn't JSON comes back as null, so a single
 * missing item doesn't blank the whole feed. Results keep the order of `urls`.
 */
export async function fetchMany(
  urls: readonly string[],
  headers: Record<string, string>,
  timeoutMs: number
): Promise<unknown[]> {
  const results: unknown[] = new Array(urls.length).fill(null);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < urls.length) {
      const i = next++;
      try {
        results[i] = await fetchJson(urls[i], headers, timeoutMs, true);
      } catch {
        results[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL_GETS, urls.length) }, worker));
  return results;
}
