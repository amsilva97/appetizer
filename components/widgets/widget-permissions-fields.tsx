"use client";

import type { Permission } from "@/types/permissions";

interface Props {
  permissions: string[];
  onChange: (permissions: string[]) => void;
  available: Permission[];
}

export default function WidgetPermissionsFields({ permissions, onChange, available }: Props) {
  function toggle(id: string) {
    if (permissions.includes(id)) {
      onChange(permissions.filter((p) => p !== id));
    } else {
      onChange([...permissions, id]);
    }
  }

  if (available.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-zinc-500 leading-relaxed">
          No permissions defined yet.{" "}
          <a href="/admin/permissions" className="text-zinc-400 underline hover:text-zinc-200 transition-colors">
            Create some
          </a>{" "}
          to restrict who can see this widget.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Only users with at least one matching permission will see this widget.
        Leave all unchecked to make it visible to everyone.
      </p>
      <div className="flex flex-col gap-2">
        {available.map((p) => (
          <label key={p.id} className="flex items-center gap-3 cursor-pointer group py-1">
            <div
              role="checkbox"
              aria-checked={permissions.includes(p.id)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(p.id); } }}
              onClick={() => toggle(p.id)}
              className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                permissions.includes(p.id)
                  ? "bg-white border-white"
                  : "border-zinc-600 group-hover:border-zinc-400"
              }`}
            >
              {permissions.includes(p.id) && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-zinc-200 leading-tight">{p.label}</span>
              <span className="text-[10px] text-zinc-600 font-mono">{p.id}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
