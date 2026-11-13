import vm from "node:vm";
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

export function runTransform(body: unknown, transformCode: string): unknown {
  const context = vm.createContext(Object.create(null));
  context.body = body;
  const script = new vm.Script(transformCode);
  return script.runInContext(context, { timeout: TRANSFORM_TIMEOUT_MS });
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
