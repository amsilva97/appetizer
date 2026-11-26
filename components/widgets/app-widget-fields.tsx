"use client";

import { useState } from "react";
import type { AppWidgetConfig, CoverFit } from "@/types/app-widget";
import { resolveAppPadding } from "@/types/app-widget";
import { normalizeFeed } from "@/lib/feed/normalize";
import FeedFields from "@/components/widgets/feed-fields";
import { Divider, Select, SliderRow, TabBar, TextInput, Toggle } from "@/components/ui";
import { SpacingFields, YamlTab } from "@/components/widgets/shared-fields";
import { normalizeAppConfig } from "@/lib/widget-config";
import { resolveSpacing } from "@/types/spacing";
import WidgetPermissionsFields from "@/components/widgets/widget-permissions-fields";
import type { Permission } from "@/types/permissions";

type Tab = "display" | "visuals" | "connection" | "feed" | "yaml" | "permissions";

const TABS: { id: Tab; label: string }[] = [
  { id: "display",     label: "Display"     },
  { id: "visuals",     label: "Visuals"     },
  { id: "connection",  label: "Connection"  },
  { id: "feed",        label: "Feed"        },
  { id: "yaml",        label: "YAML"        },
  { id: "permissions", label: "Permissions" },
];

const LOGO_VIEW_OPTIONS = [
  { value: "icon", label: "Icon"       },
  { value: "none", label: "No icon"    },
  { value: "full", label: "Full cover" },
  { value: "compact", label: "Compact" },
];

const COVER_FIT_OPTIONS: { value: CoverFit; label: string }[] = [
  { value: "cover",   label: "Fill the card (crops)"        },
  { value: "contain", label: "Whole image (blurred edges)" },
];

interface Props {
  value: AppWidgetConfig;
  onChange: (v: AppWidgetConfig) => void;
  keyNames?: string[];
  permissions?: string[];
  onPermissionsChange?: (p: string[]) => void;
  availablePermissions?: Permission[];
}

export default function AppWidgetFields({ value, onChange, keyNames = [], permissions = [], onPermissionsChange, availablePermissions = [] }: Props) {
  const [tab, setTab] = useState<Tab>("display");

  return (
    <div className="flex flex-col gap-5">
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "display" && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="Title"
            value={value.title}
            placeholder="My App"
            onChange={(title) => onChange({ ...value, title })}
          />
          <TextInput
            label="Subtitle"
            value={value.subtitle ?? ""}
            placeholder="optional"
            onChange={(subtitle) => onChange({ ...value, subtitle })}
          />
          <TextInput
            label="Tooltip"
            value={value.tooltip ?? ""}
            placeholder="Shown on hover"
            onChange={(tooltip) => onChange({ ...value, tooltip })}
          />

          <Divider />

          <Select
            label="Logo view"
            value={value.logoView}
            options={LOGO_VIEW_OPTIONS}
            onChange={(v) => onChange({ ...value, logoView: v as AppWidgetConfig["logoView"] })}
          />
          {value.logoView !== "none" && (
            <TextInput
              label="Logo URL"
              value={value.logoUrl ?? ""}
              placeholder="https://example.com/icon.png"
              onChange={(logoUrl) => onChange({ ...value, logoUrl })}
            />
          )}
          {value.logoView === "full" && (
            <>
              <Select
                label="Image fit"
                value={value.coverFit ?? "cover"}
                options={COVER_FIT_OPTIONS}
                onChange={(v) => onChange({ ...value, coverFit: v as CoverFit })}
              />
              <SliderRow
                label="Icon zoom"
                value={value.iconZoom ?? 1}
                min={0.5} max={3} step={0.05}
                display={`${Math.round((value.iconZoom ?? 1) * 100)}%`}
                onChange={(iconZoom) => onChange({ ...value, iconZoom })}
              />
              <SliderRow
                label="Offset X"
                value={value.iconOffsetX ?? 0}
                min={-100} max={100} step={1}
                display={`${value.iconOffsetX ?? 0}%`}
                onChange={(iconOffsetX) => onChange({ ...value, iconOffsetX })}
              />
              <SliderRow
                label="Offset Y"
                value={value.iconOffsetY ?? 0}
                min={-100} max={100} step={1}
                display={`${value.iconOffsetY ?? 0}%`}
                onChange={(iconOffsetY) => onChange({ ...value, iconOffsetY })}
              />
            </>
          )}
        </div>
      )}

      {tab === "visuals" && (
        <div className="flex flex-col gap-4">
          <SliderRow
            label="Width"
            value={value.width}
            min={160} max={480} step={8}
            display={`${value.width}px`}
            onChange={(width) => onChange({ ...value, width })}
          />
          <SliderRow
            label="Height"
            value={value.height}
            min={48} max={300} step={4}
            display={`${value.height}px`}
            onChange={(height) => onChange({ ...value, height })}
          />
          <SpacingFields
            label="Padding"
            value={resolveAppPadding(value.padding)}
            onChange={(padding) => onChange({ ...value, padding })}
          />
          <SpacingFields
            label="Margin"
            value={resolveSpacing(value.margin, 0)}
            onChange={(margin) => onChange({ ...value, margin })}
          />
          <SliderRow
            label="Corner radius"
            value={value.borderRadius ?? 16}
            min={0} max={48} step={1}
            display={`${value.borderRadius ?? 16}px`}
            onChange={(borderRadius) => onChange({ ...value, borderRadius })}
          />
        </div>
      )}

      {tab === "connection" && (
        <div className="flex flex-col gap-4">
          <TextInput
            label="URL"
            value={value.url}
            placeholder="https://example.com"
            onChange={(url) => onChange({ ...value, url })}
          />
          <Toggle
            checked={value.openUrl}
            label="Click to open URL"
            onChange={(openUrl) => onChange({ ...value, openUrl })}
          />

          <Divider />

          <Toggle
            checked={value.ping}
            label="Show online status"
            onChange={(ping) => onChange({ ...value, ping })}
          />
          {value.ping && (
            <div className="flex flex-col gap-4 pl-3 border-l-2 border-zinc-700">
              <TextInput
                label="Ping URL"
                value={value.pingUrl ?? ""}
                placeholder="Defaults to URL above"
                onChange={(pingUrl) => onChange({ ...value, pingUrl })}
              />
              <SliderRow
                label="Check every"
                value={value.pingInterval}
                min={10} max={300} step={10}
                display={`${value.pingInterval}s`}
                onChange={(pingInterval) => onChange({ ...value, pingInterval })}
              />
            </div>
          )}
        </div>
      )}

      {tab === "feed" && (
        <FeedFields
          value={normalizeFeed(value.feed)}
          keyNames={keyNames}
          onChange={(feed) => onChange({ ...value, feed })}
        />
      )}

      {tab === "yaml" && <YamlTab value={value} normalize={normalizeAppConfig} onChange={onChange} />}

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
