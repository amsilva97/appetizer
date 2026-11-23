import { readKeys } from "@/lib/auth/keys";
import { can } from "@/lib/auth/viewer";
import { requirePageCapability } from "@/lib/auth/page-guard";
import KeysManager from "@/components/admin/keys-manager";
import { PageHeader } from "@/components/admin/admin-ui";

export const instant = false;

export default async function KeysPage() {
  const viewer = await requirePageCapability("keys:read");
  const keyNames = Object.keys(readKeys());

  return (
    <div className="space-y-6">
      <PageHeader title="Secret keys">
        Server-side API keys for feed sources. Reference them in feed headers with{" "}
        <code className="text-xs font-mono text-fg bg-surface-2 px-1.5 py-0.5 rounded">{"{KEY_NAME}"}</code>.
      </PageHeader>
      <KeysManager keyNames={keyNames} canWrite={can(viewer, "keys:write")} canDelete={can(viewer, "keys:delete")} />
    </div>
  );
}
