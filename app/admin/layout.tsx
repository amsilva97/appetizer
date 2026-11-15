import Link from "next/link";
import AdminNav from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-brand/[0.05] blur-3xl" />
      </div>
      <div className="h-0.5 bg-gradient-to-r from-brand to-brand-alt shrink-0 relative z-10" />

      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 shrink-0 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-2">
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
        </div>
      </header>

      <div className="bg-black/10 border-b border-white/10 shrink-0">
        <AdminNav />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
