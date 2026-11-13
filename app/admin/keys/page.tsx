import Link from "next/link";
import { readKeys } from "@/lib/auth/keys";
import KeysManager from "@/components/admin/keys-manager";

export default function KeysPage() {
  const keyNames = Object.keys(readKeys());

  return (
    <main className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-zinc-100">Secret keys</h1>
            <p className="text-sm text-zinc-400">
              Keys are stored server-side and never sent to the browser. Reference them in feed headers using {"{KEY_NAME}"}.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            ← Home
          </Link>
        </div>

        <KeysManager keyNames={keyNames} />
      </div>
    </main>
  );
}
