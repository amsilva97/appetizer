import { NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { PageMeta } from "@/types/permissions";
import { getSession } from "@/lib/auth/session";

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
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  const index = readIndex();
  const pageIdx = index.pages.findIndex((p) => p.name === name);
  if (pageIdx === -1) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const body = await request.json() as { label?: string; permissions?: string[] };
  const updated = { ...index.pages[pageIdx] };
  if (typeof body.label === "string" && body.label.trim()) updated.label = body.label.trim();
  if (Array.isArray(body.permissions)) updated.permissions = body.permissions;

  index.pages = index.pages.map((p, i) => (i === pageIdx ? updated : p));
  writeIndex(index);

  return NextResponse.json({ page: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
