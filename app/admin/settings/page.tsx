import { allowlistEnforced, readSettings } from "@/lib/auth/settings";
import { ipMatches, trustedProxiesFromEnv } from "@/lib/auth/ip";
import { can } from "@/lib/auth/viewer";
import { requirePageCapability } from "@/lib/auth/page-guard";
import SettingsManager from "@/components/admin/settings-manager";
import { PageHeader } from "@/components/admin/admin-ui";

export const instant = false;

export default async function SettingsPage() {
  const viewer = await requirePageCapability("settings:read");
  const settings = readSettings();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings">Who can reach the dashboard, and where admin rights work from.</PageHeader>
      <SettingsManager
        settings={settings}
        clientIp={viewer.clientIp}
        clientAllowed={ipMatches(viewer.clientIp, settings.adminIpAllowlist.entries)}
        trustedProxies={trustedProxiesFromEnv()}
        overriddenByEnv={settings.adminIpAllowlist.enabled && !allowlistEnforced(settings)}
        canUpdate={can(viewer, "settings:update")}
        canEditAllowlist={can(viewer, "settings:update") && viewer.isAdmin}
      />
    </div>
  );
}
