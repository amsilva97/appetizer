import { readKeys } from "@/lib/auth/keys";
import KeysManager from "@/components/admin/keys-manager";

export default function KeysPage() {
  const keyNames = Object.keys(readKeys());

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-fg">Secret Keys</h1>
        <div className="mt-3 h-0.5 w-8 bg-gradient-to-r from-brand to-brand-alt" />
        <p className="mt-2 text-sm text-fg-muted">
          Server-side API keys for feed sources. Reference them in feed headers with{" "}
          <code className="text-xs font-mono text-fg bg-surface-2 px-1.5 py-0.5 rounded">
            {"{KEY_NAME}"}
          </code>
          .
        </p>
      </div>
      <KeysManager keyNames={keyNames} />
    </div>
  );
}
