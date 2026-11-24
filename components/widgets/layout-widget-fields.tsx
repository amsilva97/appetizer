"use client";

import { useState } from "react";
import {
  DEFAULT_LAYOUT_WIDGET,
  type GutterOrientation,
  type GutterSides,
  type GutterSize,
  type GutterSizeMode,
  type LayoutType,
  type LayoutWidgetConfig,
  type LayoutWidgetLayout,
} from "@/types/layout-widget";
import { Divider, Select, SliderRow, TabBar, TextInput } from "@/components/ui";
import WidgetPermissionsFields from "@/components/widgets/widget-permissions-fields";
import {
  CONTAINER_TABS,
  ContainerVisualsFields,
  YamlTab,
  type ContainerTab,
} from "@/components/widgets/shared-fields";
import { resolveLayout } from "@/lib/layout-cells";
import { normalizeLayoutConfig } from "@/lib/widget-config";
import type { Permission } from "@/types/permissions";

const LAYOUT_TYPE_OPTIONS: { label: string; value: LayoutType }[] = [
  { label: "Grid",    value: "grid"    },
  { label: "Gutters", value: "gutters" },
];

const ORIENTATION_OPTIONS: { label: string; value: GutterOrientation }[] = [
  { label: "Horizontal (gutters left & right)", value: "horizontal" },
  { label: "Vertical (gutters top & bottom)",   value: "vertical"   },
];

const SIZE_MODE_OPTIONS: { label: string; value: GutterSizeMode }[] = [
  { label: "Fixed (px)",                value: "px"          },
  { label: "Percent of layout (%)",     value: "%"           },
  { label: "Fit content (min-content)", value: "min-content" },
];

interface Props {
  value: LayoutWidgetConfig;
  onChange: (v: LayoutWidgetConfig) => void;
  permissions?: string[];
  onPermissionsChange?: (p: string[]) => void;
  availablePermissions?: Permission[];
}

function GutterSizeFields({
  label,
  axis,
  value,
  onChange,
}: {
  label: string;
  axis: "Width" | "Height";
  value: GutterSize;
  onChange: (v: GutterSize) => void;
}) {
  const isPercent = value.mode === "%";
  return (
    <div className="flex flex-col gap-3">
      <Select
        label={`${label} ${axis.toLowerCase()}`}
        value={value.mode}
        options={SIZE_MODE_OPTIONS}
        onChange={(mode) => {
          const m = mode as GutterSizeMode;
          // Switching between px and % would leave a silly number behind.
          const v = m === value.mode ? value.value : m === "%" ? 20 : m === "px" ? 240 : value.value;
          onChange({ mode: m, value: v });
        }}
      />
      {value.mode !== "min-content" ? (
        <SliderRow
          label={axis}
          value={value.value}
          min={0} max={isPercent ? 100 : 960} step={isPercent ? 1 : 8}
          display={`${value.value}${isPercent ? "%" : "px"}`}
          onChange={(v) => onChange({ ...value, value: v })}
        />
      ) : (
        <p className="text-[11px] text-fg-subtle leading-snug">
          Sizes to the menu placed in this gutter.
        </p>
      )}
    </div>
  );
}

function LayoutDisplayFields({ value, onChange }: { value: LayoutWidgetConfig; onChange: (v: LayoutWidgetConfig) => void }) {
  const layout = resolveLayout(value.layout);
  const horizontal = layout.orientation === "horizontal";
  const startName = horizontal ? "Left gutter" : "Top gutter";
  const endName = horizontal ? "Right gutter" : "Bottom gutter";
  const axis = horizontal ? "Width" : "Height";
  const sideOptions: { label: string; value: GutterSides }[] = [
    { label: `Both`,              value: "both"  },
    { label: startName,           value: "start" },
    { label: endName,             value: "end"   },
  ];

  function setLayout(patch: Partial<LayoutWidgetLayout>) {
    onChange({ ...value, layout: { ...value.layout, ...patch } });
  }

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        label="Label"
        value={value.label}
        placeholder="Layout 1"
        onChange={(label) => onChange({ ...value, label })}
      />

      <Divider />

      <Select
        label="Layout type"
        value={layout.type}
        options={LAYOUT_TYPE_OPTIONS}
        onChange={(type) => setLayout(
          type === "gutters"
            ? { type: "gutters", orientation: layout.orientation, gutters: layout.gutters, startSize: layout.startSize, endSize: layout.endSize }
            : { type: "grid" }
        )}
      />

      {layout.type === "grid" && (
        <>
          <SliderRow
            label="Columns (x)"
            value={layout.columns}
            min={1} max={12} step={1}
            display={`${layout.columns}`}
            onChange={(columns) => setLayout({ columns })}
          />
          <SliderRow
            label="Rows (y)"
            value={layout.rows}
            min={1} max={12} step={1}
            display={`${layout.rows}`}
            onChange={(rows) => setLayout({ rows })}
          />
        </>
      )}

      {layout.type === "gutters" && (
        <>
          <Select
            label="Orientation"
            value={layout.orientation!}
            options={ORIENTATION_OPTIONS}
            onChange={(orientation) => setLayout({ orientation: orientation as GutterOrientation })}
          />
          <Select
            label="Gutters"
            value={layout.gutters!}
            options={sideOptions}
            onChange={(gutters) => setLayout({ gutters: gutters as GutterSides })}
          />
          {layout.gutters !== "end" && (
            <GutterSizeFields
              label={startName}
              axis={axis}
              value={layout.startSize!}
              onChange={(startSize) => setLayout({ startSize })}
            />
          )}
          {layout.gutters !== "start" && (
            <GutterSizeFields
              label={endName}
              axis={axis}
              value={layout.endSize!}
              onChange={(endSize) => setLayout({ endSize })}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function LayoutWidgetFields({ value, onChange, permissions = [], onPermissionsChange, availablePermissions = [] }: Props) {
  const [tab, setTab] = useState<ContainerTab>("display");

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={CONTAINER_TABS} active={tab} onChange={setTab} />

      {tab === "display" && <LayoutDisplayFields value={value} onChange={onChange} />}

      {tab === "visuals" && (
        <ContainerVisualsFields
          value={value}
          defaults={DEFAULT_LAYOUT_WIDGET}
          shadowAutoHint="all edges"
          onChange={onChange}
        />
      )}

      {tab === "yaml" && <YamlTab value={value} normalize={normalizeLayoutConfig} onChange={onChange} />}

      {tab === "permissions" && (
        <WidgetPermissionsFields
          permissions={permissions}
          onChange={onPermissionsChange ?? (() => {})}
          available={availablePermissions}
        />
      )}
    </div>
  );
}
