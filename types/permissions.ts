export interface Permission {
  id: string;
  label: string;
}

/** Parts of the admin area that can be granted on their own. */
export const ADMIN_AREAS = ["users", "roles", "pages", "keys", "settings"] as const;
export type AdminArea = (typeof ADMIN_AREAS)[number];

export const CRUD_ACTIONS = ["read", "write", "update", "delete"] as const;
export type CrudAction = (typeof CRUD_ACTIONS)[number];

/** An admin capability, e.g. "users:update". */
export type Capability = `${AdminArea}:${CrudAction}`;

export interface AdminAreaInfo {
  label: string;
  description: string;
  /** What each action means for this area. Actions left out don't apply. */
  actions: Partial<Record<CrudAction, string>>;
}

export const ADMIN_AREA_INFO: Record<AdminArea, AdminAreaInfo> = {
  users: {
    label: "Users",
    description: "Accounts and who holds which roles",
    actions: {
      read: "See the user list",
      write: "Create users",
      update: "Enable, disable, promote and assign roles",
      delete: "Delete users",
    },
  },
  roles: {
    label: "Roles & permissions",
    description: "Permission and role definitions",
    actions: {
      read: "See roles and permissions",
      write: "Create roles and permissions",
      update: "Change what a role grants",
      delete: "Delete roles and permissions",
    },
  },
  pages: {
    label: "Pages",
    description: "Dashboard pages and their layout",
    actions: {
      read: "See every page in the page list",
      write: "Create pages",
      update: "Edit layouts, widgets and page settings",
      delete: "Delete pages",
    },
  },
  keys: {
    label: "Secret keys",
    description: "Server-side keys used by feeds",
    actions: {
      read: "See key names and use keys in feeds",
      write: "Add or replace keys",
      delete: "Delete keys",
    },
  },
  settings: {
    label: "Site settings",
    description: "Force login and the admin IP allowlist",
    actions: {
      read: "See site settings",
      update: "Change site settings",
    },
  },
};

/** Every capability that means something, in display order. */
export const ALL_CAPABILITIES: Capability[] = ADMIN_AREAS.flatMap((area) =>
  CRUD_ACTIONS.filter((action) => ADMIN_AREA_INFO[area].actions[action]).map(
    (action) => `${area}:${action}` as Capability
  )
);

export function isCapability(value: unknown): value is Capability {
  return typeof value === "string" && (ALL_CAPABILITIES as string[]).includes(value);
}

export interface Role {
  id: string;
  label: string;
  /** View permissions: which pages and widgets holders can see. */
  permissions: string[];
  /** Admin capabilities granted to holders. */
  capabilities?: Capability[];
}

export interface PermissionsConfig {
  permissions: Permission[];
  roles: Role[];
}

export interface PageMeta {
  name: string;
  label: string;
  permissions: string[];
}
