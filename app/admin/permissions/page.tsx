import { redirect } from "next/navigation";
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
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-fg">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Define permissions → group into roles → assign roles to users.
        </p>
      </div>
      <PermissionsManager config={config} users={users} />
    </div>
  );
}
