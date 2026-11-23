/** Building blocks shared by the admin screens: panels, tables, badges, notices. */

export const INPUT =
  "w-full h-9 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "focus:border-brand/60 transition-colors";

export const SELECT =
  "h-9 px-3 text-sm text-fg bg-surface-2 border border-line rounded-lg " +
  "focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/60 transition-colors";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-fg">{title}</h1>
      <div className="mt-3 h-0.5 w-8 bg-gradient-to-r from-brand to-brand-alt" />
      {children && <div className="mt-2 text-sm text-fg-muted max-w-3xl">{children}</div>}
    </div>
  );
}

export function Panel({
  heading,
  subheading,
  actions,
  children,
}: {
  heading: string;
  subheading?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-surface border border-line overflow-hidden">
      <div className="px-6 py-4 border-b border-line flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-fg">{heading}</h2>
          {subheading && <p className="text-sm text-fg-muted mt-0.5">{subheading}</p>}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export type BadgeVariant = "neutral" | "amber" | "red" | "brand" | "green";

export function Badge({ label, variant = "neutral", title }: { label: string; variant?: BadgeVariant; title?: string }) {
  const cls = {
    neutral: "text-fg-muted bg-white/5 ring-line",
    amber: "text-warning bg-warning/10 ring-warning/20",
    red: "text-danger bg-danger/10 ring-danger/20",
    brand: "text-brand bg-brand/10 ring-brand/20",
    green: "text-success bg-success/10 ring-success/20",
  }[variant];
  return (
    <span title={title} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs whitespace-nowrap ring-1 ${cls}`}>
      {label}
    </span>
  );
}

export function Notice({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2.5">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p role="status" className="text-sm text-success bg-success/10 border border-success/20 rounded-lg px-4 py-2.5">
        {success}
      </p>
    );
  }
  return null;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-8 text-center text-sm text-fg-subtle">
        {children}
      </td>
    </tr>
  );
}

/** Table wrapper that scrolls sideways on narrow screens instead of squashing. */
export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm border-collapse ${className}`}>{children}</table>
    </div>
  );
}

export const TH = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-subtle border-b border-line whitespace-nowrap";
export const TD = "px-4 py-3 border-b border-line align-middle";
export const ROW = "hover:bg-white/[0.02] transition-colors";

export function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export const ICON_BTN_DANGER =
  "inline-flex items-center justify-center size-8 rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10 disabled:opacity-30 disabled:pointer-events-none transition-colors";

export const SMALL_BTN =
  "h-7 px-3 rounded-md text-xs font-medium text-fg-muted bg-surface-2 hover:bg-white/10 hover:text-fg disabled:opacity-30 disabled:pointer-events-none transition-colors";

export function Avatar({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center justify-center size-8 rounded-full bg-surface-2 border border-line text-sm font-medium text-fg-muted shrink-0 select-none">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
