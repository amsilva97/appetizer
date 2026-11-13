import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { readPermissionsConfig } from "@/lib/auth/permissions";
import { readUsers } from "@/lib/auth/users";
import PermissionsManager from "@/components/admin/permissions-manager";

export const instant = false;

export default async function PermissionsPage() {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") redirect("/");

  const config = readPermissionsConfig();
  const users = readUsers();

  return (
    <main className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-zinc-100">Roles & Permissions</h1>
            <p className="text-sm text-zinc-400">
              Define permissions, group them into roles, and assign roles to users.
            </p>
          </div>
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Home
          </Link>
        </div>

        <PermissionsManager
          config={config}
          users={users}
        />
      </div>
    </main>
  );
}
