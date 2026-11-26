import { fetchMany, runStep, STEP_TIMEOUT_MS } from "@/lib/feed/runner";
import type { FeedStep } from "@/types/feed";

/** Most rounds of get() one step may need, e.g. a get() whose path comes from another get(). */
const MAX_GET_ROUNDS = 6;
/** Longest one get() request may take. */
const GET_TIMEOUT_MS = 5000;

export interface PipelineContext {
  /** The Get URL. get() paths resolve against it and must stay on its host. */
  feedUrl: string;
  /** The Get's headers, keys already substituted. get() sends the same ones. */
  headers: Record<string, string>;
  /** Epoch ms after which the run gives up. */
  deadline: number;
}

/** A path a step passed to get(), as an absolute URL on the feed's own origin. */
export function resolveGetUrl(path: string, feedUrl: string): string {
  const url = new URL(path, feedUrl);
  if (url.origin !== new URL(feedUrl).origin) {
    throw new Error(`get() can only reach the Get URL's host (${new URL(feedUrl).host}), not ${url.host}`);
  }
  return url.href;
}

function remaining(ctx: PipelineContext): number {
  const left = ctx.deadline - Date.now();
  if (left <= 0) throw new Error("The feed took too long");
  return left;
}

/** Fetch every path a step asked for and add the results to `cache`. */
async function fetchPending(
  paths: readonly string[],
  cache: Record<string, string>,
  ctx: PipelineContext
): Promise<Record<string, string>> {
  const urls = paths.map((p) => resolveGetUrl(p, ctx.feedUrl));
  const results = await fetchMany(urls, ctx.headers, Math.min(GET_TIMEOUT_MS, remaining(ctx)));
  return { ...cache, ...Object.fromEntries(paths.map((p, i) => [p, JSON.stringify(results[i] ?? null)])) };
}

async function runOneStep(
  step: FeedStep,
  input: unknown,
  cache: Record<string, string>,
  ctx: PipelineContext
): Promise<{ value: unknown[]; cache: Record<string, string> }> {
  let current = cache;
  for (let round = 0; round <= MAX_GET_ROUNDS; round++) {
    const result = runStep(step.kind, step.code, input, current, Math.min(STEP_TIMEOUT_MS, remaining(ctx)));
    if ("value" in result) return { value: result.value, cache: current };
    current = await fetchPending(result.pending, current, ctx);
  }
  throw new Error(`Too many rounds of get() (max ${MAX_GET_ROUNDS})`);
}

/**
 * Run a feed's steps, in order, over the Get's parsed body. Returns the final
 * list. Throws an Error naming the step that failed. Fetched get() data is
 * shared across steps, so the same path is only requested once per run.
 */
export async function runPipeline(body: unknown, steps: readonly FeedStep[], ctx: PipelineContext): Promise<unknown[]> {
  remaining(ctx);
  if (steps.length === 0) {
    if (Array.isArray(body)) return body;
    throw new Error("The response isn't a list. Add a transform step that returns one, e.g. body => body.results");
  }

  let data: unknown = body;
  let cache: Record<string, string> = {};
  for (const [i, step] of steps.entries()) {
    try {
      ({ value: data, cache } = await runOneStep(step, data, cache, ctx));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Step error";
      throw new Error(msg === "The feed took too long" ? msg : `Step ${i + 1} (${step.kind}): ${msg}`);
    }
  }
  return data as unknown[];
}
