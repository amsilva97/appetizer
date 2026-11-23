import { readPermissionsConfig } from "@/lib/auth/permissions";
import { readUsers, toPublicUser } from "@/lib/auth/users";
import { can } from "@/lib/auth/viewer";
import { requirePageCapability } from "@/lib/auth/page-guard";
import { effectiveAccess, permissionUsage } from "@/lib/auth/effective";
import { readIndex } from "@/lib/data/layouts";
import PermissionsManager from "@/components/admin/permissions-manager";
import { PageHeader } from "@/components/admin/admin-ui";

export const instant = false;

export default async function PermissionsPage() {
  const viewer = await requirePageCapability("roles:read");

  const config = readPermissionsConfig();
  const usersRead = can(viewer, "users:read");
  const users = usersRead ? readUsers().map(toPublicUser) : [];
  const pages = readIndex()?.pages ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & permissions">
        <p>
          <strong className="text-fg font-medium">Roles</strong> bundle two kinds of access:{" "}
          <strong className="text-fg font-medium">admin capabilities</strong> (read, write, update and delete for each
          admin area) and <strong className="text-fg font-medium">view permissions</strong> (tags that decide which pages
          and widgets someone sees). Give roles to users, then check the result in <em>Who can do what</em>.
        </p>
      </PageHeader>
      <PermissionsManager
        config={config}
        users={users}
        effective={usersRead ? effectiveAccess(users, config) : []}
        usage={permissionUsage(users, config, pages)}
        abilities={{
          username: viewer.username ?? "",
          isAdmin: viewer.isAdmin,
          held: [...viewer.capabilities],
          rolesWrite: can(viewer, "roles:write"),
          rolesUpdate: can(viewer, "roles:update"),
          rolesDelete: can(viewer, "roles:delete"),
          usersRead,
          usersUpdate: can(viewer, "users:update"),
        }}
      />
    </div>
  );
}
