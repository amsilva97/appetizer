import vm from "node:vm";
import { types } from "node:util";
import { substituteKeys } from "@/lib/auth/keys";

const MAX_BODY_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5000;
const TRANSFORM_TIMEOUT_MS = 2000;

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

const MAX_ERROR_CHARS = 500;

/**
 * Runs inside the sandbox. Everything the transform could hook (its own code,
 * getters, toJSON, error messages) happens in this one call, under the
 * timeout. It hands back a plain JSON string: {"value": ...} or {"error": "..."}.
 * Built-ins are captured before the transform runs so it can't swap them out.
 */
const WRAPPER = new vm.Script(`(function (src, input, lookupsInput) {
  "use strict";
  var parse = JSON.parse, stringify = JSON.stringify, toStr = String;
  var FAIL = '{"error":"Transform error"}';
  globalThis.body = parse(input);
  globalThis.lookups = parse(lookupsInput);
  var value, failed = false, msg;
  try {
    value = (0, eval)(src);
  } catch (e) {
    failed = true;
    try { msg = toStr(e !== null && typeof e === "object" && "message" in e ? e.message : e); }
    catch (_) { msg = "Transform error"; }
  }
  try {
    return failed ? stringify({ error: msg }) : stringify({ value: value === undefined ? null : value });
  } catch (_) {
    return FAIL;
  }
})(__src, __input, __lookups)`);

/**
 * Run a feed transform in its own JS realm.
 *
 * node:vm is only safe while no host object is reachable from inside: a host
 * object's constructor chain leads to the host's Function and from there to
 * `process`. So only strings cross the boundary, both ways: the body goes in
 * as JSON, and the result comes back as a JSON string. The host never reads a
 * property of, or assigns into, anything the transform could have touched.
 * Only admins can author transforms.
 *
 * `lookups` holds the parsed responses of the feed's follow-up requests, in
 * order (null for one that failed); the transform sees it as `lookups`.
 */
export function runTransform(body: unknown, transformCode: string, lookups: readonly unknown[] = []): unknown {
  const context = vm.createContext(Object.create(null), {
    codeGeneration: { strings: true, wasm: false },
    microtaskMode: "afterEvaluate",
  });
  // Set before any transform code exists in this realm, so no setter can intercept them.
  context.__src = transformCode;
  context.__input = JSON.stringify(body ?? null);
  context.__lookups = JSON.stringify(lookups);

  let out: unknown;
  try {
    out = WRAPPER.runInContext(context, { timeout: TRANSFORM_TIMEOUT_MS });
  } catch (err) {
    throw new Error(safeMessage(err));
  }

  if (typeof out !== "string") throw new Error("Transform returned nothing");
  const parsed = JSON.parse(out) as { value?: unknown; error?: string };
  if (typeof parsed.error === "string") throw new Error(parsed.error.slice(0, MAX_ERROR_CHARS));
  return parsed.value;
}

/**
 * Read a message from something thrown, without running any code it carries:
 * proxies are skipped and only plain data properties are read.
 */
function safeMessage(err: unknown): string {
  if (typeof err !== "object" || err === null || types.isProxy(err)) return "Transform error";
  const desc = Object.getOwnPropertyDescriptor(err, "message");
  return desc && "value" in desc && typeof desc.value === "string"
    ? desc.value.slice(0, MAX_ERROR_CHARS)
    : "Transform error";
}

export async function fetchFeed(
  url: string,
  headers: Record<string, string>
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
    });

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
 * Fetch a feed's follow-up URLs in parallel with the feed's headers. One that
 * fails, returns an error status or isn't JSON comes back as null, so a single
 * missing item doesn't blank the whole feed. Results keep the order of `urls`.
 */
export async function fetchLookups(
  urls: readonly string[],
  headers: Record<string, string>
): Promise<unknown[]> {
  return Promise.all(
    urls.map(async (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, { headers, signal: controller.signal });
        if (!res.ok) return null;
        const text = await res.text();
        return text.length > MAX_BODY_BYTES ? null : (JSON.parse(text) as unknown);
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    })
  );
}
