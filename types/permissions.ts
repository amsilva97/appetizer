export interface Permission {
  id: string;
  label: string;
}

export interface Role {
  id: string;
  label: string;
  permissions: string[];
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
