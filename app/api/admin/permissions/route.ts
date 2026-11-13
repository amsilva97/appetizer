import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { readPermissionsConfig, writePermissionsConfig } from "@/lib/auth/permissions";
import type { Permission, Role } from "@/types/permissions";

function slugify(id: string): string {
  return id
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = readPermissionsConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { kind: "permission" | "role"; id?: string; label?: string; permissions?: string[] };

  if (!body.kind) return NextResponse.json({ error: "kind is required" }, { status: 400 });

  const rawId = (body.id ?? body.label ?? "").trim();
  const id = slugify(rawId);
  const label = (body.label ?? id).trim();

  if (!id) return NextResponse.json({ error: "id or label is required" }, { status: 400 });

  const config = readPermissionsConfig();

  if (body.kind === "permission") {
    if (config.permissions.some((p) => p.id === id)) {
      return NextResponse.json({ error: `Permission "${id}" already exists` }, { status: 409 });
    }
    const perm: Permission = { id, label };
    writePermissionsConfig({ ...config, permissions: [...config.permissions, perm] });
    return NextResponse.json({ permission: perm });
  }

  if (body.kind === "role") {
    if (config.roles.some((r) => r.id === id)) {
      return NextResponse.json({ error: `Role "${id}" already exists` }, { status: 409 });
    }
    const permIds = (body.permissions ?? []).filter((pid) =>
      config.permissions.some((p) => p.id === pid)
    );
    const role: Role = { id, label, permissions: permIds };
    writePermissionsConfig({ ...config, roles: [...config.roles, role] });
    return NextResponse.json({ role });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { kind: "permission" | "role"; id: string; label?: string; permissions?: string[] };
  const config = readPermissionsConfig();

  if (body.kind === "permission") {
    const idx = config.permissions.findIndex((p) => p.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    const updated = { ...config.permissions[idx], label: body.label ?? config.permissions[idx].label };
    writePermissionsConfig({
      ...config,
      permissions: config.permissions.map((p, i) => (i === idx ? updated : p)),
    });
    return NextResponse.json({ permission: updated });
  }

  if (body.kind === "role") {
    const idx = config.roles.findIndex((r) => r.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    const updated: Role = {
      ...config.roles[idx],
      label: body.label ?? config.roles[idx].label,
      permissions: Array.isArray(body.permissions) ? body.permissions : config.roles[idx].permissions,
    };
    writePermissionsConfig({
      ...config,
      roles: config.roles.map((r, i) => (i === idx ? updated : r)),
    });
    return NextResponse.json({ role: updated });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as "permission" | "role" | null;
  const id = searchParams.get("id");

  if (!kind || !id) return NextResponse.json({ error: "kind and id are required" }, { status: 400 });

  const config = readPermissionsConfig();

  if (kind === "permission") {
    writePermissionsConfig({
      permissions: config.permissions.filter((p) => p.id !== id),
      roles: config.roles.map((r) => ({ ...r, permissions: r.permissions.filter((p) => p !== id) })),
    });
    return NextResponse.json({ ok: true });
  }

  if (kind === "role") {
    writePermissionsConfig({ ...config, roles: config.roles.filter((r) => r.id !== id) });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
}
