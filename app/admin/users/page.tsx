import { redirect } from "next/navigation";
import Link from "next/link";
import { readUsers } from "@/lib/auth/users";
import { readSettings } from "@/lib/auth/settings";
import { getSession } from "@/lib/auth/session";
import UsersManager from "@/components/admin/users-manager";

export const instant = false;

export default async function UsersPage() {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") redirect("/");

  const users = readUsers();
  const settings = readSettings();

  return (
    <main className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-zinc-100">Users</h1>
            <p className="text-sm text-zinc-400">
              Manage who can access and edit this homepage.
            </p>
          </div>
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            ← Home
          </Link>
        </div>

        <UsersManager
          users={users}
          settings={settings}
          currentUsername={session.username ?? ""}
        />
      </div>
    </main>
  );
}
