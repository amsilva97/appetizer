import { NextResponse } from "next/server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";
import type { BackgroundConfig } from "@/types/background";
import type { WidgetInstance } from "@/types/widget";

const DATA_DIR = join(process.cwd(), "data");

interface IndexConfig {
  active: string;
  import: string[];
}

interface LayoutConfig {
  name: string;
  background: BackgroundConfig;
  widgets: WidgetInstance[];
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readIndex(): IndexConfig | null {
  const p = join(DATA_DIR, "index.yaml");
  if (!existsSync(p)) return null;
  return yaml.load(readFileSync(p, "utf-8")) as IndexConfig;
}

function readLayout(name: string): LayoutConfig | null {
  const p = join(DATA_DIR, `${name}.yaml`);
  if (!existsSync(p)) return null;
  return yaml.load(readFileSync(p, "utf-8")) as LayoutConfig;
}

export async function GET() {
  ensureDir();
  const index = readIndex();
  if (!index) return NextResponse.json({ index: null, layout: null });
  const layout = readLayout(index.active);
  return NextResponse.json({ index, layout });
}

export async function POST(request: Request) {
  ensureDir();

  const body = (await request.json()) as {
    background: BackgroundConfig;
    widgets: WidgetInstance[];
  };

  let index = readIndex();
  if (!index) {
    index = { active: "home", import: ["home.yaml"] };
    writeFileSync(
      join(DATA_DIR, "index.yaml"),
      yaml.dump(index, { indent: 2 })
    );
  }

  const existing = readLayout(index.active);
  const layout: LayoutConfig = {
    name: existing?.name ?? index.active,
    background: body.background,
    widgets: body.widgets,
  };

  writeFileSync(
    join(DATA_DIR, `${index.active}.yaml`),
    yaml.dump(layout, { indent: 2, lineWidth: -1 })
  );

  return NextResponse.json({ ok: true });
}
