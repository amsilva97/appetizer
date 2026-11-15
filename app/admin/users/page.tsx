import { redirect } from "next/navigation";
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
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-fg">Users</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Manage who can access and edit this dashboard.
        </p>
      </div>
      <UsersManager
        users={users}
        settings={settings}
        currentUsername={session.username ?? ""}
      />
    </div>
  );
}
