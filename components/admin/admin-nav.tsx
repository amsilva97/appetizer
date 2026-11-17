"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const TABS = [
  { href: "/admin/users",       label: "Users",       Icon: UsersIcon  },
  { href: "/admin/keys",        label: "Keys",        Icon: KeyIcon    },
  { href: "/admin/permissions", label: "Permissions", Icon: ShieldIcon },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="max-w-5xl mx-auto px-6 flex gap-1">
      {TABS.map(({ href, label, Icon }) => {
        const active = path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 py-3 px-3 text-sm border-b-2 -mb-px transition-colors ${
              active
                ? "border-brand text-brand font-medium"
                : "border-transparent text-fg-muted hover:text-fg"
            }`}
          >
            <span className="shrink-0"><Icon /></span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
