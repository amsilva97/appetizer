import { afterEach, describe, expect, test } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";

afterEach(cleanup);
import { useState } from "react";
import MenuCarousel from "@/components/widgets/menu-carousel";
import MenuWidget from "@/components/widgets/menu-widget";
import LayoutWidget from "@/components/widgets/layout-widget";
import MenuWidgetFields from "@/components/widgets/menu-widget-fields";
import LayoutWidgetFields from "@/components/widgets/layout-widget-fields";
import { YamlTab } from "@/components/widgets/shared-fields";
import { DEFAULT_EDGE_SHADOW } from "@/types/edge-shadow";
import { DEFAULT_MENU_WIDGET, type MenuWidgetConfig } from "@/types/menu-widget";
import { DEFAULT_LAYOUT_WIDGET, type LayoutWidgetConfig } from "@/types/layout-widget";
import { DEFAULT_APP_WIDGET } from "@/types/app-widget";
import { normalizeMenuConfig } from "@/lib/widget-config";
import { useWidgetDraft } from "@/lib/use-widget-draft";
import type { WidgetInstance } from "@/types/widget";

const items = ["A", "B", "C", "D", "E"].map((k) => ({ key: k, node: <span>item-{k}</span> }));
const pad = { top: 0, right: 0, bottom: 0, left: 0 };

function shownSlots(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll("[data-carousel-slot]")).map((el) => Number(el.getAttribute("data-carousel-slot")));
}

describe("MenuCarousel", () => {
  test("pages forward and stops at the end", () => {
    render(<MenuCarousel items={items} direction="horizontal" visibleCount={3} gap={8} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />);
    expect(screen.queryByLabelText("Previous")).toBeNull();
    fireEvent.click(screen.getByLabelText("Next"));
    fireEvent.click(screen.getByLabelText("Next"));
    expect(screen.queryByLabelText("Next")).toBeNull();
    expect(screen.getByLabelText("Previous")).toBeTruthy();
  });

  test("infinite mode can go back from the first app to the last", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="horizontal" visibleCount={3} infinite gap={8} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />
    );
    expect(shownSlots(container)).toEqual([-1, 0, 1, 2, 3]);
    fireEvent.click(screen.getByLabelText("Previous"));
    expect(shownSlots(container)).toEqual([-2, -1, 0, 1, 2]);
    // Slot -1 shows the last item.
    const slot = container.querySelector('[data-carousel-slot="-1"]')!;
    expect(slot.textContent).toBe("item-E");
  });

  test("arrow keys page along the direction", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="vertical" visibleCount={2} gap={0} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />
    );
    const region = screen.getByRole("region");
    fireEvent.keyDown(region, { key: "ArrowDown" });
    const track = container.querySelector("[data-carousel-track]") as HTMLElement;
    expect(track.style.transform).toContain("translateY");
    expect(track.style.transform).toContain("-1");
  });

  test("edge shadow hides at an end with nothing past it", () => {
    const { container } = render(
      <MenuCarousel items={items} direction="horizontal" visibleCount={3} gap={0} padding={pad}
        edgeShadow={{ ...DEFAULT_EDGE_SHADOW, enabled: true }} />
    );
    const left = container.querySelector('[data-edge-shadow="left"]') as HTMLElement;
    const right = container.querySelector('[data-edge-shadow="right"]') as HTMLElement;
    expect(left.style.opacity).toBe("0");
    expect(right.style.opacity).toBe("1");
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
    render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={() => {}} />);
    expect(screen.getByText("Menu type")).toBeTruthy();
    render(<LayoutWidgetFields value={DEFAULT_LAYOUT_WIDGET} onChange={() => {}} />);
    expect(screen.getByText("Layout type")).toBeTruthy();
  });

  test("carousel options appear only for carousels", () => {
    const { rerender } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={() => {}} />);
    expect(screen.queryByText("Apps shown at once")).toBeNull();
    rerender(<MenuWidgetFields value={{ ...DEFAULT_MENU_WIDGET, type: "carousel" }} onChange={() => {}} />);
    expect(screen.getByText("Apps shown at once")).toBeTruthy();
  });

  test("spacing can be split into four sides", () => {
    let last: MenuWidgetConfig | null = null;
    render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={(v) => { last = v; }} />);
    fireEvent.click(screen.getByText("Visuals"));
    const margin = document.querySelector('[data-spacing-field="Margin"]') as HTMLElement;
    fireEvent.click(margin.querySelector("button")!);
    const sliders = margin.querySelectorAll('input[type="range"]');
    expect(sliders).toHaveLength(4);
    fireEvent.change(sliders[3], { target: { value: "10" } });
    expect(last!.margin).toEqual({ top: 0, right: 0, bottom: 0, left: 10 });
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

  test("edits flow out, and an outside change (Revert) flows back in", () => {
    render(<Harness />);
    const area = screen.getByLabelText("YAML") as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: "label: Typed\ntype: list" } });
    expect(screen.getByTestId("label").textContent).toBe("Typed");
    expect(area.value).toBe("label: Typed\ntype: list");
    fireEvent.click(screen.getByText("revert"));
    expect(area.value).toContain("label: Menu");
  });

  test("non-mapping YAML shows an error and changes nothing", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("YAML"), { target: { value: "just text" } });
    expect(screen.getByText(/Expected a YAML mapping/)).toBeTruthy();
    expect(screen.getByTestId("label").textContent).toBe("Menu");
  });
});

describe("useWidgetDraft", () => {
  const base: WidgetInstance[] = [{ id: "m", type: "menu", config: DEFAULT_MENU_WIDGET, x: 0, y: 0 }];

  test("previews, reverts and saves", () => {
    const saved: Partial<WidgetInstance>[] = [];
    const { result } = renderHook(() => useWidgetDraft(base, "m", (_id, p) => saved.push(p)));

    act(() => result.current.change({ config: { ...DEFAULT_MENU_WIDGET, label: "Live" } }));
    expect((result.current.editingWidget!.config as MenuWidgetConfig).label).toBe("Live");
    expect(result.current.hasChanges).toBe(true);
    expect(saved).toHaveLength(0);

    act(() => result.current.revert());
    expect((result.current.viewWidgets[0].config as MenuWidgetConfig).label).toBe("Menu");
    expect(result.current.hasChanges).toBe(false);

    act(() => result.current.change({ permissions: ["team"] }));
    act(() => result.current.save());
    expect(saved).toEqual([{ config: DEFAULT_MENU_WIDGET, permissions: ["team"] }]);
  });

  test("ignores a draft for a widget that isn't open", () => {
    const { result, rerender } = renderHook(({ id }) => useWidgetDraft(base, id, () => {}), { initialProps: { id: "m" as string | null } });
    act(() => result.current.change({ config: { ...DEFAULT_MENU_WIDGET, label: "Live" } }));
    rerender({ id: null });
    expect((result.current.viewWidgets[0].config as MenuWidgetConfig).label).toBe("Menu");
  });
});

describe("MenuCarousel input", () => {
  function setup() {
    return render(<MenuCarousel items={items} direction="horizontal" visibleCount={2} gap={0} padding={pad} edgeShadow={DEFAULT_EDGE_SHADOW} />);
  }
  const transform = (c: HTMLElement) => (c.querySelector("[data-carousel-track]") as HTMLElement).style.transform;

  test("a wheel tick pages once, then waits out the cooldown", () => {
    const { container } = setup();
    const region = screen.getByRole("region");
    fireEvent.wheel(region, { deltaY: 100, timeStamp: 1000 });
    const after = transform(container);
    expect(after).toContain("-1");
    fireEvent.wheel(region, { deltaY: 3 });
    expect(transform(container)).toBe(after);
  });

  test("a swipe pages and swallows the click it ends on", () => {
    const { container } = setup();
    const region = screen.getByRole("region");
    fireEvent.pointerDown(region, { clientX: 200, clientY: 0 });
    fireEvent.pointerUp(region, { clientX: 100, clientY: 0 });
    expect(transform(container)).toContain("-1");
    let clicked = false;
    region.addEventListener("click", () => { clicked = true; });
    fireEvent.click(screen.getByText("item-B"));
    expect(clicked).toBe(false);
  });
});

describe("Edge shadow fields", () => {
  test("turning it on reveals its settings", () => {
    let last: MenuWidgetConfig | null = null;
    const { rerender } = render(<MenuWidgetFields value={DEFAULT_MENU_WIDGET} onChange={(v) => { last = v; }} />);
    fireEvent.click(screen.getByText("Visuals"));
    expect(screen.queryByText("Shadow depth")).toBeNull();
    fireEvent.click(screen.getByLabelText("Edge shadow"));
    expect(last!.edgeShadow?.enabled).toBe(true);
    rerender(<MenuWidgetFields value={last!} onChange={() => {}} />);
    expect(screen.getByText("Shadow depth")).toBeTruthy();
    expect(screen.getByText("Auto (top & bottom)")).toBeTruthy();
  });
});
