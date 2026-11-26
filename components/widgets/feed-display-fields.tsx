"use client";

import type { AppFeedConfig, FeedColumn, FeedColumnType, FeedFilterButton, FeedStyles, SubDirection } from "@/types/feed";
import { moveItem, removeAt, replaceAt } from "@/lib/feed/list-edit";
import { CodeBox, ListCard, SectionHeader, SmallInput, SmallSelect, StyleRuleFields } from "@/components/widgets/feed-editor-parts";
import { Divider } from "@/components/ui";

const COLUMN_TYPES: { value: FeedColumnType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "link", label: "Link" },
  { value: "badge", label: "Badge" },
  { value: "progress", label: "Progress (0-100)" },
  { value: "image", label: "Image" },
];

const SUB_DIRECTIONS: { value: SubDirection; label: string }[] = [
  { value: "below", label: "Below" },
  { value: "beside", label: "Beside" },
];

const NEW_COLUMN: FeedColumn = { label: "", type: "text", key: "" };
const NEW_BUTTON: FeedFilterButton = { label: "", key: "", equals: "", showCount: true };

function ColumnCard({ column, index, count, onChange, onMove, onRemove }: {
  column: FeedColumn;
  index: number;
  count: number;
  onChange: (c: FeedColumn) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<FeedColumn>) => onChange({ ...column, ...patch });
  return (
    <ListCard title={column.label || column.key || `Column ${index + 1}`} index={index} count={count} onMove={onMove} onRemove={onRemove}>
      <div className="grid grid-cols-2 gap-1.5">
        <SmallInput label="Label" value={column.label} placeholder="Request" onChange={(label) => set({ label })} />
        <SmallSelect label="Type" value={column.type} options={COLUMN_TYPES} onChange={(type) => set({ type })} />
        <SmallInput label="Key" value={column.key} placeholder="title" onChange={(key) => set({ key })} />
        <SmallInput label="Width" value={column.width ?? ""} placeholder="auto, 30%, 48px" onChange={(width) => set({ width: width || undefined })} />
        {column.type === "link" && (
          <SmallInput label="Link URL key" value={column.hrefKey ?? ""} placeholder="url" onChange={(hrefKey) => set({ hrefKey: hrefKey || undefined })} />
        )}
        <SmallInput label="Sub key" value={column.subKey ?? ""} placeholder="optional" onChange={(subKey) => set({ subKey: subKey || undefined })} />
        {column.subKey && (
          <SmallSelect label="Sub position" value={column.subDirection ?? "below"} options={SUB_DIRECTIONS} onChange={(subDirection) => set({ subDirection })} />
        )}
      </div>
      <StyleRuleFields label="Main" value={column.style} onChange={(style) => set({ style })} />
      {column.subKey && <StyleRuleFields label="Sub" value={column.subStyle} onChange={(subStyle) => set({ subStyle })} />}
    </ListCard>
  );
}

function ButtonCard({ button, index, count, onChange, onMove, onRemove }: {
  button: FeedFilterButton;
  index: number;
  count: number;
  onChange: (b: FeedFilterButton) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const set = (patch: Partial<FeedFilterButton>) => onChange({ ...button, ...patch });
  return (
    <ListCard title={button.label || `Button ${index + 1}`} index={index} count={count} onMove={onMove} onRemove={onRemove}>
      <div className="grid grid-cols-3 gap-1.5">
        <SmallInput label="Label" value={button.label} placeholder="pending" onChange={(label) => set({ label })} />
        <SmallInput label="Key" value={button.key} placeholder="state" onChange={(key) => set({ key })} />
        <SmallInput label="Equals" value={button.equals} placeholder="pending" onChange={(equals) => set({ equals })} />
      </div>
      <label className="flex items-center gap-2 text-[11px] text-zinc-400">
        <input type="checkbox" checked={button.showCount ?? false} onChange={(e) => set({ showCount: e.target.checked })} />
        Show how many rows match
      </label>
      <CodeBox label="CSS" value={button.style ?? ""} rows={1} placeholder="color: #fbbf24" onChange={(style) => set({ style })} />
    </ListCard>
  );
}

export default function FeedDisplayFields({ feed, onChange }: {
  feed: AppFeedConfig;
  onChange: (patch: Partial<AppFeedConfig>) => void;
}) {
  const { columns, filterButtons, styles } = feed;
  const setStyles = (patch: Partial<FeedStyles>) => onChange({ styles: { ...styles, ...patch } });

  return (
    <>
      <div className="flex flex-col gap-2">
        <SectionHeader
          title="Columns"
          hint={<>Each column reads a key from every row, e.g. <span className="font-mono">title</span> or <span className="font-mono">media.status</span>. Values always show as text. No columns: a simple title/subtitle list.</>}
          onAdd={() => onChange({ columns: [...columns, { ...NEW_COLUMN }] })}
        />
        {columns.map((column, i) => (
          <ColumnCard
            key={i}
            column={column}
            index={i}
            count={columns.length}
            onChange={(c) => onChange({ columns: replaceAt(columns, i, c) })}
            onMove={(d) => onChange({ columns: moveItem(columns, i, d) })}
            onRemove={() => onChange({ columns: removeAt(columns, i) })}
          />
        ))}
      </div>

      <Divider />

      <div className="flex flex-col gap-2">
        <SectionHeader
          title="Row link"
          hint={<>Makes each row open its own page in a new tab. Put row keys in braces: <span className="font-mono">{"http://host/series/{titleSlug}"}</span>; <span className="font-mono">{"{{key}}"}</span> works too. Rows with a missing value aren&apos;t clickable.</>}
        />
        <SmallInput label="URL template" value={feed.rowLink} placeholder="optional" onChange={(rowLink) => onChange({ rowLink })} />
      </div>

      <Divider />

      <div className="flex flex-col gap-2">
        <SectionHeader
          title="Filter buttons"
          hint="Shown above the list. Click toggles one on or off; several on show rows matching any of them. Double-click shows only that one."
          onAdd={() => onChange({ filterButtons: [...filterButtons, { ...NEW_BUTTON }] })}
        />
        {filterButtons.map((button, i) => (
          <ButtonCard
            key={i}
            button={button}
            index={i}
            count={filterButtons.length}
            onChange={(b) => onChange({ filterButtons: replaceAt(filterButtons, i, b) })}
            onMove={(d) => onChange({ filterButtons: moveItem(filterButtons, i, d) })}
            onRemove={() => onChange({ filterButtons: removeAt(filterButtons, i) })}
          />
        ))}
      </div>

      <Divider />

      <div className="flex flex-col gap-2">
        <SectionHeader title="Feed styles" hint="CSS for the feed panel itself." />
        <CodeBox label="Panel CSS" value={styles.panel ?? ""} rows={1} placeholder="background: #0b0b0fa6" onChange={(panel) => setStyles({ panel })} />
        <CodeBox label="Filter bar CSS" value={styles.filterBar ?? ""} rows={1} onChange={(filterBar) => setStyles({ filterBar })} />
        <CodeBox label="Header row CSS" value={styles.header ?? ""} rows={1} onChange={(header) => setStyles({ header })} />
        <StyleRuleFields label="Row" value={styles.row} onChange={(row) => setStyles({ row })} />
      </div>
    </>
  );
}
