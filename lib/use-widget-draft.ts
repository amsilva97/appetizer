import { useState } from "react";
import type { WidgetInstance } from "@/types/widget";

/** Unsaved edits to one widget. The canvas shows them; Save writes them to the page. */
export interface WidgetDraft {
  id: string;
  config: WidgetInstance["config"];
  permissions: string[];
}

export type DraftPatch = { config?: WidgetInstance["config"]; permissions?: string[] };

export interface WidgetDraftState {
  /** Saved widgets with the open editor's changes on top: what the canvas draws. */
  viewWidgets: WidgetInstance[];
  /** The widget being edited, as previewed. */
  editingWidget: WidgetInstance | null;
  hasChanges: boolean;
  change: (patch: DraftPatch) => void;
  /** Write the draft to the page. */
  save: () => void;
  /** Throw the draft away; the canvas goes back to what's saved. */
  revert: () => void;
}

/** Apply a draft over the saved widgets. Pure, so the canvas and tests agree. */
export function applyDraft(widgets: WidgetInstance[], draft: WidgetDraft | null): WidgetInstance[] {
  if (!draft) return widgets;
  return widgets.map((w) =>
    w.id === draft.id ? { ...w, config: draft.config, permissions: draft.permissions } : w
  );
}

export function draftDiffers(draft: WidgetDraft | null, saved: WidgetInstance | null): boolean {
  if (!draft || !saved) return false;
  return (
    JSON.stringify(draft.config) !== JSON.stringify(saved.config) ||
    JSON.stringify(draft.permissions) !== JSON.stringify(saved.permissions ?? [])
  );
}

/**
 * Live editing for one widget at a time. Changes show on the canvas straight
 * away but only reach `widgets` (and so the saved page) on save. A draft for a
 * widget that's no longer the one being edited is ignored.
 */
export function useWidgetDraft(
  widgets: WidgetInstance[],
  editingId: string | null,
  onSave: (id: string, partial: Partial<WidgetInstance>) => void
): WidgetDraftState & { reset: () => void } {
  const [draft, setDraft] = useState<WidgetDraft | null>(null);
  const saved = widgets.find((w) => w.id === editingId) ?? null;
  const active = draft && saved && draft.id === saved.id ? draft : null;
  const viewWidgets = applyDraft(widgets, active);

  function change(patch: DraftPatch) {
    if (!saved) return;
    setDraft((prev) => {
      const current: WidgetDraft = prev && prev.id === saved.id
        ? prev
        : { id: saved.id, config: saved.config, permissions: saved.permissions ?? [] };
      return { ...current, ...patch };
    });
  }

  function save() {
    if (!active) return;
    onSave(active.id, { config: active.config, permissions: active.permissions });
    setDraft(null);
  }

  return {
    viewWidgets,
    editingWidget: viewWidgets.find((w) => w.id === editingId) ?? null,
    hasChanges: draftDiffers(active, saved),
    change,
    save,
    revert: () => setDraft(null),
    reset: () => setDraft(null),
  };
}
