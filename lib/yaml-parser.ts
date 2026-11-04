import * as yaml from "js-yaml";

export function parse<T>(content: string): T {
  return yaml.load(content) as T;
}

export function stringify<T>(data: T): string {
  return yaml.dump(data, { indent: 2, lineWidth: -1 });
}

export async function loadFile<T>(file: File): Promise<T> {
  const text = await file.text();
  return parse<T>(text);
}

export function download<T>(data: T, filename: string): void {
  const content = stringify(data);
  const blob = new Blob([content], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".yaml") ? filename : `${filename}.yaml`;
  a.click();
  URL.revokeObjectURL(url);
}
