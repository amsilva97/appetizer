/** Shared pieces for the admin matrices: grouped column headers and cells. */

import {
  ADMIN_AREAS,
  ADMIN_AREA_INFO,
  CRUD_ACTIONS,
  type Capability,
  type CrudAction,
  type Permission,
} from "@/types/permissions";

export const ACTION_LETTER: Record<CrudAction, string> = { read: "R", write: "W", update: "U", delete: "D" };
export const ACTION_NAME: Record<CrudAction, string> = { read: "Read", write: "Write", update: "Update", delete: "Delete" };

/** Every area × action pair, in column order, with whether it means anything. */
export const CAPABILITY_COLUMNS = ADMIN_AREAS.flatMap((area) =>
  CRUD_ACTIONS.map((action) => ({
    area,
    action,
    cap: `${area}:${action}` as Capability,
    help: ADMIN_AREA_INFO[area].actions[action],
  }))
);

const GROUP_TH = "px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-line whitespace-nowrap text-center";
const SUB_TH = "px-0 py-1.5 text-[11px] font-mono font-semibold text-fg-subtle border-b border-line text-center w-8 min-w-8";
export const STICKY_TH = "sticky left-0 z-10 bg-surface px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-r border-line whitespace-nowrap";
export const STICKY_TD = "sticky left-0 z-10 bg-surface px-4 py-2.5 border-b border-r border-line whitespace-nowrap";
export const CELL = "border-b border-line text-center p-0 h-10";
/** Divider before each area so the groups read as blocks. */
export const groupEdge = (i: number) => (i % CRUD_ACTIONS.length === 0 ? "border-l border-line" : "");

/**
 * Two header rows: area names over their R W U D columns, then (optionally)
 * a "View permissions" block with one column per permission.
 */
export function MatrixHeader({
  rowLabel,
  permissions = [],
  extraGroups = [],
}: {
  rowLabel: string;
  permissions?: Permission[];
  /** Extra column groups before the capabilities, e.g. roles in the user matrix. */
  extraGroups?: { label: string; columns: { id: string; label: string; title?: string }[] }[];
}) {
  return (
    <thead>
      <tr>
        <th rowSpan={2} className={STICKY_TH}>{rowLabel}</th>
        {extraGroups.map((g) =>
          g.columns.length ? (
            <th key={g.label} colSpan={g.columns.length} className={`${GROUP_TH} border-l`}>{g.label}</th>
          ) : null
        )}
        {ADMIN_AREAS.map((area) => (
          <th
            key={area}
            colSpan={CRUD_ACTIONS.length}
            className={`${GROUP_TH} border-l`}
            title={ADMIN_AREA_INFO[area].description}
          >
            {ADMIN_AREA_INFO[area].label}
          </th>
        ))}
        {permissions.length > 0 && (
          <th colSpan={permissions.length} className={`${GROUP_TH} border-l`}>View permissions</th>
        )}
      </tr>
      <tr>
        {extraGroups.flatMap((g) =>
          g.columns.map((c, i) => (
            <th key={`${g.label}-${c.id}`} title={c.title ?? c.label} className={`${SUB_TH} px-2 w-auto font-sans normal-case ${i === 0 ? "border-l border-line" : ""}`}>
              {c.label}
            </th>
          ))
        )}
        {CAPABILITY_COLUMNS.map(({ cap, action, help }, i) => (
          <th
            key={cap}
            title={help ? `${ACTION_NAME[action]}: ${help}` : `${ACTION_NAME[action]}: not used for this area`}
            className={`${SUB_TH} ${groupEdge(i)} ${help ? "" : "opacity-30"}`}
          >
            {ACTION_LETTER[action]}
          </th>
        ))}
        {permissions.map((p, i) => (
          <th key={p.id} title={p.id} className={`${SUB_TH} px-2 w-auto font-sans normal-case ${i === 0 ? "border-l border-line" : ""}`}>
            {p.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** A cell for a capability that doesn't apply to its area. */
export function NotApplicable({ edge }: { edge: string }) {
  return (
    <td className={`${CELL} ${edge}`} aria-label="Not applicable">
      <span className="text-fg-subtle/40 select-none">·</span>
    </td>
  );
}

/** Read-only granted / not granted mark, with where it came from on hover. */
export function Mark({ on, source, edge = "" }: { on: boolean; source?: string; edge?: string }) {
  return (
    <td className={`${CELL} ${edge}`} title={on ? source : undefined}>
      {on ? (
        <span className="inline-block size-2.5 rounded-full bg-brand" aria-label={`Granted${source ? ` by ${source}` : ""}`} />
      ) : (
        <span className="inline-block size-2.5 rounded-full border border-line" aria-label="Not granted" />
      )}
    </td>
  );
}

export function MatrixLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-6 py-3 text-xs text-fg-subtle border-t border-line">
      {CRUD_ACTIONS.map((a) => (
        <span key={a}>
          <span className="font-mono font-semibold text-fg-muted">{ACTION_LETTER[a]}</span> {ACTION_NAME[a]}
        </span>
      ))}
      <span><span className="text-fg-muted">·</span> doesn&apos;t apply</span>
      <span>Hover a column for what it allows.</span>
    </div>
  );
}

export const CHECKBOX = "accent-brand size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 align-middle";
