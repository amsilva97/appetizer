import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/admin-nav";
import { adminTabsFor } from "@/lib/admin-tabs";
import { getViewer, hasAnyCapability } from "@/lib/auth/viewer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.loggedIn) redirect("/login");
  if (!hasAnyCapability(viewer)) redirect("/");

  const tabs = adminTabsFor(viewer.capabilities);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="h-0.5 bg-gradient-to-r from-brand to-brand-alt shrink-0" />

      <header className="bg-bg/80 backdrop-blur border-b border-line shrink-0 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mark.png" alt="" className="h-5 w-auto" />
            <span className="text-sm font-semibold text-fg">appetizer</span>
          </Link>
          <span className="text-white/20 text-sm select-none mx-1">/</span>
          <Link href="/" className="text-sm text-fg-muted hover:text-fg transition-colors">
            Dashboard
          </Link>
          <span className="text-white/20 text-sm select-none mx-1">/</span>
          <span className="text-sm text-fg">Admin</span>
          <span className="ml-auto text-xs text-fg-subtle">
            {viewer.username}
            {viewer.isAdmin ? " · admin" : " · limited admin"}
            {viewer.clientIp && <span className="font-mono"> · {viewer.clientIp}</span>}
          </span>
        </div>
      </header>

      <div className="border-b border-line shrink-0">
        <AdminNav tabs={tabs} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
