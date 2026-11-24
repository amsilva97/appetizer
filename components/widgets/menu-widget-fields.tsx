"use client";

import { useState } from "react";
import {
  DEFAULT_MENU_WIDGET,
  DEFAULT_VISIBLE_COUNT,
  type MenuDirection,
  type MenuType,
  type MenuWidgetConfig,
} from "@/types/menu-widget";
import { Divider, Select, SliderRow, TabBar, TextInput, Toggle } from "@/components/ui";
import WidgetPermissionsFields from "@/components/widgets/widget-permissions-fields";
import {
  CONTAINER_TABS,
  ContainerVisualsFields,
  YamlTab,
  type ContainerTab,
} from "@/components/widgets/shared-fields";
import { MAX_VISIBLE } from "@/lib/carousel";
import { normalizeMenuConfig } from "@/lib/widget-config";
import type { Permission } from "@/types/permissions";

const MENU_TYPE_OPTIONS: { label: string; value: MenuType }[] = [
  { label: "List",     value: "list"     },
  { label: "Carousel", value: "carousel" },
];

const DIRECTION_OPTIONS: { label: string; value: MenuDirection }[] = [
  { label: "Vertical",   value: "vertical"   },
  { label: "Horizontal", value: "horizontal" },
];

interface Props {
  value: MenuWidgetConfig;
  onChange: (v: MenuWidgetConfig) => void;
  permissions?: string[];
  onPermissionsChange?: (p: string[]) => void;
  availablePermissions?: Permission[];
}

function MenuDisplayFields({ value, onChange }: { value: MenuWidgetConfig; onChange: (v: MenuWidgetConfig) => void }) {
  const type: MenuType = value.type === "carousel" ? "carousel" : "list";
  const visible = value.visibleCount ?? DEFAULT_VISIBLE_COUNT;

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        label="Label"
        value={value.label}
        placeholder="Menu 1"
        onChange={(label) => onChange({ ...value, label })}
      />
      <Toggle
        label="Show label above the apps"
        checked={value.showLabel !== false}
        onChange={(showLabel) => onChange({ ...value, showLabel })}
      />

      <Divider />

      <Select
        label="Menu type"
        value={type}
        options={MENU_TYPE_OPTIONS}
        onChange={(t) => onChange({ ...value, type: t as MenuType })}
      />
      <Select
        label="Direction"
        value={value.direction}
        options={DIRECTION_OPTIONS}
        onChange={(direction) => onChange({ ...value, direction: direction as MenuDirection })}
      />

      {type === "carousel" && (
        <>
          <SliderRow
            label="Apps shown at once"
            value={visible}
            min={1} max={MAX_VISIBLE} step={1}
            display={`${visible}`}
            onChange={(visibleCount) => onChange({ ...value, visibleCount })}
          />
          <Toggle
            label="Infinite scroll (loop back to the start)"
            checked={value.infinite ?? false}
            onChange={(infinite) => onChange({ ...value, infinite })}
          />
        </>
      )}
    </div>
  );
}

export default function MenuWidgetFields({ value, onChange, permissions = [], onPermissionsChange, availablePermissions = [] }: Props) {
  const [tab, setTab] = useState<ContainerTab>("display");
  const scrollAxis = value.direction === "horizontal" ? "left & right" : "top & bottom";

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={CONTAINER_TABS} active={tab} onChange={setTab} />

      {tab === "display" && <MenuDisplayFields value={value} onChange={onChange} />}

      {tab === "visuals" && (
        <ContainerVisualsFields
          value={value}
          defaults={DEFAULT_MENU_WIDGET}
          shadowAutoHint={scrollAxis}
          onChange={onChange}
        />
      )}

      {tab === "yaml" && <YamlTab value={value} normalize={normalizeMenuConfig} onChange={onChange} />}

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
