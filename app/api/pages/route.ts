import { NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { PageMeta } from "@/types/permissions";
import type { BackgroundConfig } from "@/types/background";
import { getSession } from "@/lib/auth/session";
import { BACKGROUND_PRESETS } from "@/lib/background-presets";

const DATA_DIR = join(process.cwd(), "data");

interface IndexConfig {
  active: string;
  pages: PageMeta[];
  import?: string[];
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readIndex(): IndexConfig {
  const p = join(DATA_DIR, "index.yaml");
  if (!existsSync(p)) return { active: "home", pages: [{ name: "home", label: "Home", permissions: [] }] };
  const raw = yaml.load(readFileSync(p, "utf-8")) as IndexConfig;
  if (!raw) return { active: "home", pages: [{ name: "home", label: "Home", permissions: [] }] };

  if (!raw.pages && Array.isArray(raw.import)) {
    raw.pages = raw.import.map((file) => {
      const name = file.replace(/\.yaml$/, "");
      return { name, label: name.charAt(0).toUpperCase() + name.slice(1), permissions: [] };
    });
    delete raw.import;
  }
  if (!raw.pages) raw.pages = [{ name: raw.active ?? "home", label: "Home", permissions: [] }];
  return raw;
}

function writeIndex(index: IndexConfig): void {
  ensureDir();
  const tmp = join(DATA_DIR, "index.yaml.tmp");
  writeFileSync(tmp, yaml.dump(index, { indent: 2 }), "utf-8");
  renameSync(tmp, join(DATA_DIR, "index.yaml"));
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "page";
}

function uniqueSlug(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function GET() {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  ensureDir();
  const index = readIndex();
  return NextResponse.json({ pages: index.pages, active: index.active });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.loggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  ensureDir();

  const body = await request.json() as { label?: string };
  const label = (body.label ?? "New Page").trim();
  if (!label) return NextResponse.json({ error: "Label is required" }, { status: 400 });

  const index = readIndex();
  const existing = index.pages.map((p) => p.name);
  const name = uniqueSlug(slugify(label), existing);

  const newPage: PageMeta = { name, label, permissions: [] };
  index.pages = [...index.pages, newPage];
  writeIndex(index);

  const defaultBg = BACKGROUND_PRESETS["Ocean Dusk"] as BackgroundConfig;
  writeFileSync(
    join(DATA_DIR, `${name}.yaml`),
    yaml.dump({ name, background: defaultBg, widgets: [] }, { indent: 2, lineWidth: -1 })
  );

  return NextResponse.json({ page: newPage });
}
