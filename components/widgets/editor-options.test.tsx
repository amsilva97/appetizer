import { afterEach, describe, expect, test } from "vitest";
import { act, useState } from "react";
import MenuCarousel from "@/components/widgets/menu-carousel";
import MenuWidget from "@/components/widgets/menu-widget";
import LayoutWidget from "@/components/widgets/layout-widget";
import MenuWidgetFields from "@/components/widgets/menu-widget-fields";
import LayoutWidgetFields from "@/components/widgets/layout-widget-fields";
import { YamlTab } from "@/components/widgets/shared-fields";
import { byLabel, byText, cleanup, fire, render } from "@/components/widgets/test-dom";
import { DEFAULT_EDGE_SHADOW } from "@/types/edge-shadow";
import { DEFAULT_MENU_WIDGET, type MenuWidgetConfig } from "@/types/menu-widget";
import { DEFAULT_LAYOUT_WIDGET, type LayoutWidgetConfig } from "@/types/layout-widget";
import { DEFAULT_APP_WIDGET, type AppWidgetConfig } from "@/types/app-widget";
import AppWidget from "@/components/widgets/app-widget";
import AppWidgetFields from "@/components/widgets/app-widget-fields";
import { normalizeMenuConfig } from "@/lib/widget-config";
import { useWidgetDraft, type WidgetDraftState } from "@/lib/use-widget-draft";
import type { WidgetInstance } from "@/types/widget";

afterEach(cleanup);

const items = ["A", "B", "C", "D", "E"].map((k) => ({ key: k, node: <span>item-{k}</span> }));
const pad = { top: 0, right: 0, bottom: 0, left: 0 };

function shownSlots(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll("[data-carousel-slot]")).map((el) => Number(el.getAttribute("data-carousel-slot")));
}

function trackTransform(container: HTMLElement): string {
  return (container.querySelector("[data-carousel-track]") as HTMLElement).style.transform;
}

describe("MenuCarousel", () => {
  test("pages forward and stops at the end", () => {
    const { container } = render(<MenuCarousel items={items} direction="horizontal" visibleCount={3} gap={8} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />);
    expect(byLabel(container, "Previous")).toBeNull();
    fire.click(byLabel(container, "Next")!);
    fire.click(byLabel(container, "Next")!);
    expect(byLabel(container, "Next")).toBeNull();
    expect(byLabel(container, "Previous")).not.toBeNull();
  });

  test("infinite mode can go back from the first app to the last", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="horizontal" visibleCount={3} infinite gap={8} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />
    );
    expect(shownSlots(container)).toEqual([-1, 0, 1, 2, 3]);
    fire.click(byLabel(container, "Previous")!);
    expect(shownSlots(container)).toEqual([-2, -1, 0, 1, 2]);
    expect(container.querySelector('[data-carousel-slot="-1"]')!.textContent).toBe("item-E");
  });

  test("arrow keys page along the direction", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="vertical" visibleCount={2} gap={0} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />
    );
    fire.keyDown(container.querySelector('[role="region"]')!, "ArrowDown");
    expect(trackTransform(container)).toContain("translateY");
    expect(trackTransform(container)).toContain("-1");
  });

  test("edge shadow shows on both chosen edges, even at the start", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="horizontal" visibleCount={3} gap={0} padding={pad}
        edgeShadow={{ ...DEFAULT_EDGE_SHADOW, enabled: true }} />
    );
    const shown = Array.from(container.querySelectorAll("[data-edge-shadow]")).map((e) => e.getAttribute("data-edge-shadow"));
    expect(shown).toEqual(["right", "left"]);
  });

  test("dots show the position and jump to a stop when clicked", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="horizontal" visibleCount={3} gap={0} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} showDots />
    );
    const dots = container.querySelectorAll("[data-carousel-dot]");
    expect(dots).toHaveLength(3);
    expect(dots[0].getAttribute("aria-current")).toBe("true");
    fire.click(dots[2]);
    expect(trackTransform(container)).toContain("-2");
    expect(container.querySelectorAll("[data-carousel-dot]")[2].getAttribute("aria-current")).toBe("true");
  });

  test("no dots unless asked for", () => {
    const { container } = render(<MenuCarousel items={items} direction="horizontal" visibleCount={3} gap={0} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />);
    expect(container.querySelector("[data-carousel-dot]")).toBeNull();
  });

  test("peek offsets the first slot so the neighbours show", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="horizontal" visibleCount={1} infinite gap={16} peek={80} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />
    );
    const first = container.querySelector('[data-carousel-slot="0"]') as HTMLElement;
    expect(first.style.left).toContain("96px");
  });

  test("a wheel tick pages once, then waits out the cooldown", () => {
    const { container } = render(<MenuCarousel items={items} direction="horizontal" visibleCount={2} gap={0} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />);
    const region = container.querySelector('[role="region"]')!;
    fire.wheel(region, 100);
    const after = trackTransform(container);
    expect(after).toContain("-1");
    fire.wheel(region, 100);
    expect(trackTransform(container)).toBe(after);
  });

  test("a swipe pages and swallows the click it ends on", () => {
    const { container } = render(<MenuCarousel items={items} direction="horizontal" visibleCount={2} gap={0} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />);
    const region = container.querySelector('[role="region"]')!;
    fire.pointer(region, "pointerdown", 200);
    fire.pointer(region, "pointerup", 100);
    expect(trackTransform(container)).toContain("-1");
    let clicked = false;
    region.addEventListener("click", () => { clicked = true; });
    fire.click(container.querySelector('[data-carousel-slot="1"] span')!);
    expect(clicked).toBe(false);
  });
});

describe("MenuWidget", () => {
  const apps: WidgetInstance[] = [1, 2, 3, 4].map((n) => ({
    id: `app${n}`, type: "app", parentId: "m", config: { ...DEFAULT_APP_WIDGET, title: `App ${n}` }, x: 0, y: 0,
  }));

  test("renders a carousel when the menu type is carousel", () => {
    const config: MenuWidgetConfig = { ...DEFAULT_MENU_WIDGET, label: "Fav", type: "carousel", direction: "horizontal", visibleCount: 2 };
    const { container } = render(<MenuWidget config={config} widgetId="m" allWidgets={apps} />);
    expect(container.querySelector("[data-carousel-track]")).not.toBeNull();
  });

  test("applies per-side margin", () => {
    const config: MenuWidgetConfig = { ...DEFAULT_MENU_WIDGET, margin: { top: 1, right: 2, bottom: 3, left: 4 } };
    const { container } = render(<MenuWidget config={config} widgetId="m" allWidgets={[]} />);
    const box = container.querySelector("[data-menu-widget]") as HTMLElement;
    expect([box.style.top, box.style.right, box.style.bottom, box.style.left]).toEqual(["1px", "2px", "3px", "4px"]);
  });
});

describe("MenuWidget edge shadow", () => {
  test("a short horizontal list still shows its left and right fade", () => {
    const apps: WidgetInstance[] = [1, 2].map((n) => ({
      id: `a${n}`, type: "app", parentId: "m", config: { ...DEFAULT_APP_WIDGET, title: `A${n}` }, x: 0, y: 0,
    }));
    const config: MenuWidgetConfig = {
      ...DEFAULT_MENU_WIDGET, direction: "horizontal",
      edgeShadow: { ...DEFAULT_EDGE_SHADOW, enabled: true, edges: "horizontal" },
    };
    const { container } = render(<MenuWidget config={config} widgetId="m" allWidgets={apps} />);
    const shown = Array.from(container.querySelectorAll("[data-edge-shadow]")).map((e) => e.getAttribute("data-edge-shadow"));
    expect(shown).toEqual(["right", "left"]);
  });
});

describe("LayoutWidget", () => {
  test("gutter cells carry their fixed cell numbers", () => {
    const config: LayoutWidgetConfig = {
      ...DEFAULT_LAYOUT_WIDGET,
      layout: { type: "gutters", columns: 1, rows: 1, orientation: "horizontal", gutters: "end", endSize: { mode: "px", value: 120 } },
    };
    const { container } = render(<LayoutWidget config={config} widgetId="L" allWidgets={[]} />);
    const cells = Array.from(container.querySelectorAll("[data-layout-cell]")).map((c) => c.getAttribute("data-cell-index"));
    expect(cells).toEqual(["1", "2"]);
  });
});

describe("editor fields", () => {
  test("menu and layout editors use the same grammar", () => {
    const menu = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={() => {}} />);
    expect(byText(menu.container, "Menu type")).not.toBeNull();
    const layout = render(<LayoutWidgetFields value={DEFAULT_LAYOUT_WIDGET} onChange={() => {}} />);
    expect(byText(layout.container, "Layout type")).not.toBeNull();
  });

  test("carousel options appear only for carousels", () => {
    const { container, rerender } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={() => {}} />);
    expect(byText(container, "Apps shown at once")).toBeNull();
    rerender(<MenuWidgetFields value={{ ...DEFAULT_MENU_WIDGET, type: "carousel" }} onChange={() => {}} />);
    expect(byText(container, "Apps shown at once")).not.toBeNull();
    expect(byText(container, "Show position dots")).not.toBeNull();
    expect(byLabel(container, "Peek at neighbours")).not.toBeNull();
  });

  test("spacing can be split into four sides", () => {
    let last: MenuWidgetConfig | null = null;
    const { container } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={(v) => { last = v; }} />);
    fire.click(byText(container, "Visuals")!);
    const margin = container.querySelector('[data-spacing-field="Margin"]') as HTMLElement;
    fire.click(margin.querySelector("button")!);
    const inputs = margin.querySelectorAll<HTMLInputElement>("input");
    expect(inputs).toHaveLength(4);
    fire.change(inputs[3], "1000");
    expect(last!.margin).toEqual({ top: 0, right: 0, bottom: 0, left: 1000 });
  });

  test("turning the edge shadow on reveals its settings", () => {
    let last: MenuWidgetConfig | null = null;
    const { container, rerender } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={(v) => { last = v; }} />);
    fire.click(byText(container, "Visuals")!);
    expect(byText(container, "Faded out at")).toBeNull();
    fire.click(byText(container, "Edge shadow")!);
    expect(last!.edgeShadow?.enabled).toBe(true);
    rerender(<MenuWidgetFields value={last!} onChange={() => {}} />);
    expect(byText(container, "Full strength until")).not.toBeNull();
    expect(byText(container, "Faded out at")).not.toBeNull();
    expect(byText(container, "Auto (top & bottom)")).not.toBeNull();
  });
});

describe("YamlTab", () => {
  function Harness() {
    const [value, setValue] = useState<MenuWidgetConfig>(DEFAULT_MENU_WIDGET);
    return (
      <>
        <button onClick={() => setValue(DEFAULT_MENU_WIDGET)}>revert</button>
        <span data-testid="label">{value.label}</span>
        <YamlTab value={value} normalize={normalizeMenuConfig} onChange={setValue} />
      </>
    );
  }

  const label = (c: HTMLElement) => c.querySelector('[data-testid="label"]')!.textContent;

  test("edits flow out, and an outside change (Revert) flows back in", () => {
    const { container } = render(<Harness />);
    const area = byLabel(container, "YAML") as HTMLTextAreaElement;
    fire.change(area, "label: Typed\ntype: list");
    expect(label(container)).toBe("Typed");
    expect(area.value).toBe("label: Typed\ntype: list");
    fire.click(byText(container, "revert")!);
    expect(area.value).toContain("label: Menu");
  });

  test("non-mapping YAML shows an error and changes nothing", () => {
    const { container } = render(<Harness />);
    fire.change(byLabel(container, "YAML") as HTMLTextAreaElement, "just text");
    expect(byText(container, /Expected a YAML mapping/)).not.toBeNull();
    expect(label(container)).toBe("Menu");
  });
});

describe("useWidgetDraft", () => {
  const base: WidgetInstance[] = [{ id: "m", type: "menu", config: DEFAULT_MENU_WIDGET, x: 0, y: 0 }];

  function renderDraft(editingId: string | null, onSave: (id: string, p: Partial<WidgetInstance>) => void = () => {}) {
    const ref: { current: WidgetDraftState | null } = { current: null };
    function Probe({ id }: { id: string | null }) {
      ref.current = useWidgetDraft(base, id, onSave);
      return null;
    }
    const { rerender } = render(<Probe id={editingId} />);
    return { ref, setId: (id: string | null) => rerender(<Probe id={id} />) };
  }

  const labelOf = (w: WidgetInstance | null | undefined) => (w!.config as MenuWidgetConfig).label;

  test("previews, reverts and saves", () => {
    const saved: Partial<WidgetInstance>[] = [];
    const { ref } = renderDraft("m", (_id, p) => saved.push(p));

    act(() => ref.current!.change({ config: { ...DEFAULT_MENU_WIDGET, label: "Live" } }));
    expect(labelOf(ref.current!.editingWidget)).toBe("Live");
    expect(ref.current!.hasChanges).toBe(true);
    expect(saved).toHaveLength(0);

    act(() => ref.current!.revert());
    expect(labelOf(ref.current!.viewWidgets[0])).toBe("Menu");
    expect(ref.current!.hasChanges).toBe(false);

    act(() => ref.current!.change({ permissions: ["team"] }));
    act(() => ref.current!.save());
    expect(saved).toEqual([{ config: DEFAULT_MENU_WIDGET, permissions: ["team"] }]);
  });

  test("ignores a draft for a widget that isn't open", () => {
    const { ref, setId } = renderDraft("m");
    act(() => ref.current!.change({ config: { ...DEFAULT_MENU_WIDGET, label: "Live" } }));
    setId(null);
    expect(labelOf(ref.current!.viewWidgets[0])).toBe("Menu");
  });
});

describe("number inputs", () => {
  test("gap takes any size you type, with no slider limit", () => {
    let last: MenuWidgetConfig | null = null;
    const { container } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={(v) => { last = v; }} />);
    fire.click(byText(container, "Visuals")!);
    fire.change(byLabel(container, "Gap") as HTMLInputElement, "250");
    expect(last!.gap).toBe(250);
  });

  test("half-typed text isn't sent, and negative numbers clamp to 0", () => {
    const seen: number[] = [];
    const { container } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={(v) => { seen.push(v.gap); }} />);
    fire.click(byText(container, "Visuals")!);
    const gap = byLabel(container, "Gap") as HTMLInputElement;
    fire.change(gap, "");
    fire.change(gap, "-");
    expect(seen).toEqual([]);
    fire.change(gap, "-5");
    expect(seen).toEqual([0]);
  });
});

describe("cover image fit", () => {
  const cover = { ...DEFAULT_APP_WIDGET, title: "Jelly", logoView: "full" as const, logoUrl: "https://example.test/b.svg" };

  test("cover is the default: one image that fills and crops", () => {
    const { container } = render(<AppWidget config={cover} onClick={() => {}} />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].className).toContain("object-cover");
  });

  test("whole image shows all of it over a blurred copy that fills the card", () => {
    const { container } = render(<AppWidget config={{ ...cover, coverFit: "contain" }} onClick={() => {}} />);
    const backdrop = container.querySelector("[data-cover-backdrop]") as HTMLImageElement;
    const main = container.querySelector("[data-cover-image]") as HTMLImageElement;
    expect(backdrop.className).toContain("object-cover");
    expect(main.className).toContain("object-contain");
  });

  test("once loaded, the whole image is sized to its own shape with feathered edges", () => {
    const { container } = render(<AppWidget config={{ ...cover, coverFit: "contain" }} onClick={() => {}} />);
    const main = container.querySelector("[data-cover-image]") as HTMLImageElement;
    Object.defineProperty(main, "naturalWidth", { value: 800 });
    Object.defineProperty(main, "naturalHeight", { value: 500 });
    act(() => { main.dispatchEvent(new Event("load")); });
    const loaded = container.querySelector("[data-cover-image]") as HTMLImageElement;
    // jsdom can't parse container-query widths, so only the shape and mask are checked here.
    expect(loaded.style.aspectRatio).toMatch(/^1\.6( \/ 1)?$/);
    // One ellipse, not crossed linear fades, so the edge has no box shape.
    expect(loaded.style.maskImage || loaded.style.getPropertyValue("-webkit-mask-image")).toMatch(/^radial-gradient\((ellipse )?closest-side/);
  });

  test("the editor offers the fit and lets zoom go below 100%", () => {
    let last: AppWidgetConfig | null = null;
    const { container } = render(<AppWidgetFields value={cover} onChange={(v) => { last = v; }} />);
    const fit = byLabel(container, "Image fit") as HTMLSelectElement;
    expect(fit).not.toBeNull();
    fire.select(fit, "contain");
    expect(last!.coverFit).toBe("contain");
    const zoom = byLabel(container, "Icon zoom") as HTMLInputElement;
    expect(Number(zoom.min)).toBeLessThan(1);
  });
});

describe("menu label", () => {
  test("can be hidden from the rendered menu", () => {
    const shown = render(<MenuWidget config={DEFAULT_MENU_WIDGET} widgetId="m" allWidgets={[]} />);
    expect(shown.container.querySelector("[data-menu-label]")).not.toBeNull();
    const hidden = render(<MenuWidget config={{ ...DEFAULT_MENU_WIDGET, showLabel: false }} widgetId="m" allWidgets={[]} />);
    expect(hidden.container.querySelector("[data-menu-label]")).toBeNull();
  });

  test("the Display tab toggle turns it off", () => {
    let last: MenuWidgetConfig | null = null;
    const { container } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={(v) => { last = v; }} />);
    fire.click(byText(container, "Show label above the apps")!);
    expect(last!.showLabel).toBe(false);
  });
});
