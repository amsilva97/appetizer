import { afterEach, describe, expect, test, vi } from "vitest";
import FeedFields from "@/components/widgets/feed-fields";
import { byLabel, byText, cleanup, fire, render } from "@/components/widgets/test-dom";
import { DEFAULT_FEED_CONFIG, type AppFeedConfig } from "@/types/feed";

afterEach(cleanup);

const GET: AppFeedConfig = { ...DEFAULT_FEED_CONFIG, method: "GET", url: "http://a.test" };

describe("FeedFields", () => {
  test("the first added step is a transform, later ones are maps", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<FeedFields value={GET} onChange={onChange} />);
    fire.click(byText(container, "+ Add step")!);
    expect(onChange.mock.calls[0][0].steps).toEqual([{ kind: "transform", code: "" }]);

    rerender(<FeedFields value={{ ...GET, steps: [{ kind: "transform", code: "b => b" }] }} onChange={onChange} />);
    fire.click(byText(container, "+ Add step")!);
    expect(onChange.mock.calls[1][0].steps[1]).toEqual({ kind: "map", code: "" });
  });

  test("steps can be reordered", () => {
    const onChange = vi.fn();
    const steps = [{ kind: "transform" as const, code: "a" }, { kind: "filter" as const, code: "b" }];
    const { container } = render(<FeedFields value={{ ...GET, steps }} onChange={onChange} />);
    fire.click(container.querySelectorAll('[aria-label="Move down"]')[0]);
    expect(onChange.mock.calls[0][0].steps.map((s: { code: string }) => s.code)).toEqual(["b", "a"]);
  });

  test("editing step code keeps the other steps", () => {
    const onChange = vi.fn();
    const steps = [{ kind: "transform" as const, code: "a" }, { kind: "map" as const, code: "b" }];
    const { container } = render(<FeedFields value={{ ...GET, steps }} onChange={onChange} />);
    fire.change(container.querySelectorAll("textarea")[1], "row => row.id");
    expect(onChange.mock.calls[0][0].steps).toEqual([{ kind: "transform", code: "a" }, { kind: "map", code: "row => row.id" }]);
  });

  test("columns and filter buttons can be added and removed", () => {
    const onChange = vi.fn();
    const value = { ...GET, columns: [{ label: "A", type: "text" as const, key: "a" }] };
    const { container } = render(<FeedFields value={value} onChange={onChange} />);
    const addButtons = [...container.querySelectorAll("button")].filter((b) => b.textContent === "+ Add");
    fire.click(addButtons[1]); // columns (the first is headers)
    expect(onChange.mock.calls[0][0].columns).toHaveLength(2);
    fire.click(addButtons[2]); // filter buttons
    expect(onChange.mock.calls[1][0].filterButtons).toHaveLength(1);
    fire.click(byLabel(container, "Remove")!);
    expect(onChange.mock.calls[2][0].columns).toEqual([]);
  });

  test("switching to None clears the feed", () => {
    const onChange = vi.fn();
    const { container } = render(<FeedFields value={{ ...GET, steps: [{ kind: "map", code: "x" }] }} onChange={onChange} />);
    fire.select(byLabel(container, "Method") as HTMLSelectElement, "none");
    expect(onChange.mock.calls[0][0]).toEqual(DEFAULT_FEED_CONFIG);
  });
});
