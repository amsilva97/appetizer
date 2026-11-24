/** "#rrggbb" plus a 0–100 opacity to an rgba() string. Bad input falls back to white. */
export function toRgba(hex: string | undefined, opacity: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  const value = m ? m[1] : "ffffff";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const a = Math.min(100, Math.max(0, opacity)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
