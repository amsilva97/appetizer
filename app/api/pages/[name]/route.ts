import { NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { PageMeta } from "@/types/permissions";
import { guard } from "@/lib/auth/guard";
import { can } from "@/lib/auth/viewer";
import { userCanAccess } from "@/lib/auth/permissions";

const DATA_DIR = join(process.cwd(), "data");

interface IndexConfig {
  active: string;
  pages: PageMeta[];
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readIndex(): IndexConfig {
  const p = join(DATA_DIR, "index.yaml");
  if (!existsSync(p)) return { active: "home", pages: [{ name: "home", label: "Home", permissions: [] }] };
  const raw = yaml.load(readFileSync(p, "utf-8")) as IndexConfig;
  return raw ?? { active: "home", pages: [] };
}

function writeIndex(index: IndexConfig): void {
  ensureDir();
  const tmp = join(DATA_DIR, "index.yaml.tmp");
  writeFileSync(tmp, yaml.dump(index, { indent: 2 }), "utf-8");
  renameSync(tmp, join(DATA_DIR, "index.yaml"));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const viewer = await guard("pages:update");
  if (viewer instanceof NextResponse) return viewer;

  const { name } = await params;
  const index = readIndex();
  const pageIdx = index.pages.findIndex((p) => p.name === name);
  const seeAll = can(viewer, "pages:read");
  if (pageIdx === -1 || !userCanAccess(index.pages[pageIdx].permissions, viewer.permissions, seeAll)) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { label?: unknown; permissions?: unknown };
  const updated = { ...index.pages[pageIdx] };
  if (typeof body.label === "string" && body.label.trim()) updated.label = body.label.trim().slice(0, 64);
  if (Array.isArray(body.permissions)) {
    updated.permissions = body.permissions.filter((p): p is string => typeof p === "string");
  }

  index.pages = index.pages.map((p, i) => (i === pageIdx ? updated : p));
  writeIndex(index);

  return NextResponse.json({ page: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const viewer = await guard("pages:delete");
  if (viewer instanceof NextResponse) return viewer;

  const { name } = await params;
  const index = readIndex();

  if (index.pages.length <= 1) {
    return NextResponse.json({ error: "Cannot delete the last page" }, { status: 400 });
  }

  const pageExists = index.pages.some((p) => p.name === name);
  if (!pageExists) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  index.pages = index.pages.filter((p) => p.name !== name);
  if (index.active === name) index.active = index.pages[0]?.name ?? "home";
  writeIndex(index);

  const yamlPath = join(DATA_DIR, `${name}.yaml`);
  if (existsSync(yamlPath)) unlinkSync(yamlPath);

  return NextResponse.json({ ok: true });
}
