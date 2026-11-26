"use client";

import type { AppFeedConfig, FeedHeaderRow, FeedMethod, FeedStep, FeedStepKind } from "@/types/feed";
import { DEFAULT_FEED_CONFIG } from "@/types/feed";
import { moveItem, removeAt, replaceAt } from "@/lib/feed/list-edit";
import { Divider, Select, SliderRow, TextInput } from "@/components/ui";
import { CodeBox, ListCard, SectionHeader, SmallSelect } from "@/components/widgets/feed-editor-parts";
import FeedDisplayFields from "@/components/widgets/feed-display-fields";

const METHOD_OPTIONS = [
  { value: "none", label: "None" },
  { value: "GET", label: "GET" },
];

const STEP_KINDS: { value: FeedStepKind; label: string }[] = [
  { value: "transform", label: "Transform" },
  { value: "map", label: "Map" },
  { value: "filter", label: "Filter" },
];

const STEP_HELP: Record<FeedStepKind, { hint: string; placeholder: string }> = {
  transform: {
    hint: "Gets the previous output (the response body for the first step) and returns a list.",
    placeholder: "body => body.results",
  },
  map: {
    hint: "Runs for each row and returns the new row.",
    placeholder: "row => ({ ...row, title: get(`/api/v1/movie/${row.id}`)?.title })",
  },
  filter: {
    hint: "Runs for each row; keeps it when it returns something truthy.",
    placeholder: "row => row.status !== 5",
  },
};

function HeaderRows({ headers, keyNames, onChange }: {
  headers: FeedHeaderRow[];
  keyNames: string[];
  onChange: (h: FeedHeaderRow[]) => void;
}) {
  const input =
    "flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand/40";
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        title="Headers"
        hint={
          <>
            Use <span className="font-mono text-zinc-500">{"{KEY}"}</span> in values to inject a saved key
            {keyNames.length > 0 && (
              <>: {keyNames.map((k) => <span key={k} className="font-mono text-zinc-500 mr-1">{`{${k}}`}</span>)}</>
            )}
            . Keys are filled in on the server and never reach the browser.
          </>
        }
        onAdd={() => onChange([...headers, { key: "", value: "" }])}
      />
      {headers.map((h, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={h.key} placeholder="Header name" className={input} onChange={(e) => onChange(replaceAt(headers, i, { ...h, key: e.target.value }))} />
          <input value={h.value} placeholder="Value or {KEY}" className={input} onChange={(e) => onChange(replaceAt(headers, i, { ...h, value: e.target.value }))} />
          <button aria-label="Remove header" onClick={() => onChange(removeAt(headers, i))} className="shrink-0 text-zinc-700 hover:text-red-400">✕</button>
        </div>
      ))}
    </div>
  );
}

function StepCard({ step, index, count, onChange, onMove, onRemove }: {
  step: FeedStep;
  index: number;
  count: number;
  onChange: (s: FeedStep) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const help = STEP_HELP[step.kind];
  return (
    <ListCard title={`${index + 1}. .${step.kind}()`} index={index} count={count} onMove={onMove} onRemove={onRemove}>
      <SmallSelect label="Step" value={step.kind} options={STEP_KINDS} onChange={(kind) => onChange({ ...step, kind })} />
      <p className="text-[10px] text-zinc-600 leading-snug">{help.hint}</p>
      <CodeBox value={step.code} rows={4} placeholder={help.placeholder} onChange={(code) => onChange({ ...step, code })} />
    </ListCard>
  );
}

function parseHeight(text: string): number | string {
  return /^\d+$/.test(text.trim()) ? Number(text) : text;
}

export default function FeedFields({ value, keyNames = [], onChange }: {
  value: AppFeedConfig;
  keyNames?: string[];
  onChange: (feed: AppFeedConfig) => void;
}) {
  const feed = value;
  const set = (patch: Partial<AppFeedConfig>) => onChange({ ...feed, ...patch });
  const steps = feed.steps;

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Method"
        value={feed.method}
        options={METHOD_OPTIONS}
        onChange={(m) => onChange(m === "none" ? { ...DEFAULT_FEED_CONFIG } : { ...feed, method: m as FeedMethod })}
      />

      {feed.method === "GET" && (
        <>
          <TextInput label="URL" value={feed.url} placeholder="https://api.example.com/items" onChange={(url) => set({ url })} />
          <HeaderRows headers={feed.headers} keyNames={keyNames} onChange={(headers) => set({ headers })} />

          <Divider />

          <div className="flex flex-col gap-2">
            <SectionHeader
              title="Steps"
              hint={
                <>
                  Run in order: <span className="font-mono">Get(url)</span> then each step. Each step is a function.
                  Inside it, <span className="font-mono">get(&quot;/path&quot;)</span> fetches a path on the URL&apos;s host with
                  the same headers and returns the JSON (null on failure).
                </>
              }
              onAdd={() => set({ steps: [...steps, { kind: steps.length === 0 ? "transform" : "map", code: "" }] })}
              addLabel="+ Add step"
            />
            {steps.map((step, i) => (
              <StepCard
                key={i}
                step={step}
                index={i}
                count={steps.length}
                onChange={(s) => set({ steps: replaceAt(steps, i, s) })}
                onMove={(d) => set({ steps: moveItem(steps, i, d) })}
                onRemove={() => set({ steps: removeAt(steps, i) })}
              />
            ))}
          </div>

          <Divider />

          <FeedDisplayFields feed={feed} onChange={set} />

          <Divider />

          <SliderRow
            label="Poll every"
            value={feed.pollInterval}
            min={10} max={300} step={5}
            display={`${feed.pollInterval}s`}
            onChange={(pollInterval) => set({ pollInterval })}
          />
          <TextInput
            label="Feed height"
            value={String(feed.height)}
            placeholder="200, or calc(100% - 73px)"
            onChange={(h) => set({ height: parseHeight(h) })}
          />
        </>
      )}
    </div>
  );
}
