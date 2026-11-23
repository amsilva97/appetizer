import { readUsers, toPublicUser } from "@/lib/auth/users";
import { readPermissionsConfig } from "@/lib/auth/permissions";
import { can } from "@/lib/auth/viewer";
import { requirePageCapability } from "@/lib/auth/page-guard";
import UsersManager from "@/components/admin/users-manager";
import { PageHeader } from "@/components/admin/admin-ui";

export const instant = false;

export default async function UsersPage() {
  const viewer = await requirePageCapability("users:read");

  const users = readUsers().map(toPublicUser);
  const { roles } = readPermissionsConfig();

  return (
    <div className="space-y-6">
      <PageHeader title="Users">
        Who can sign in, and whether they&apos;re an admin. Roles and page permissions are assigned on{" "}
        <a href="/admin/permissions" className="text-brand hover:underline">Roles &amp; permissions</a>.
      </PageHeader>
      <UsersManager
        users={users}
        roles={roles.map(({ id, label }) => ({ id, label }))}
        currentUsername={viewer.username ?? ""}
        abilities={{
          isAdmin: viewer.isAdmin,
          write: can(viewer, "users:write"),
          update: can(viewer, "users:update"),
          delete: can(viewer, "users:delete"),
        }}
      />
    </div>
  );
}
