import { afterEach, describe, expect, test } from "vitest";
import FeedView from "@/components/widgets/feed-view";
import { cleanup, fire, render } from "@/components/widgets/test-dom";
import { DEFAULT_FEED_CONFIG, type AppFeedConfig } from "@/types/feed";

afterEach(cleanup);

const feed = (over: Partial<AppFeedConfig>): AppFeedConfig => ({ ...DEFAULT_FEED_CONFIG, method: "GET", ...over });

const rows = [
  { title: "The Matrix", state: "pending", note: "awaiting approval", url: "https://seerr.test/movie/603", pct: 40 },
  { title: "<img src=x onerror=alert(1)>", state: "approved", note: "", url: "javascript:alert(1)", pct: 250 },
  { title: "Dune", state: "approved", note: "downloading", url: "https://seerr.test/movie/1", pct: "x" },
];

const rowTexts = (c: HTMLElement) => [...c.querySelectorAll("tbody tr")].map((tr) => tr.querySelector("td")!.textContent);

describe("FeedView", () => {
  test("a beside sub value can wrap below instead of being cut off, and its full text shows on hover", () => {
    const { container } = render(
      <FeedView
        feed={feed({ columns: [{ label: "Status", type: "badge", key: "state", subKey: "note", subDirection: "beside" }] })}
        rows={[rows[0]]}
      />
    );
    const wrap = container.querySelector('[data-sub="beside"]')!;
    expect(wrap.className).toContain("flex-wrap");
    expect(container.querySelector('[title="awaiting approval"]')?.textContent).toBe("awaiting approval");
  });

  test("shows a header per column and each row's values", () => {
    const { container } = render(
      <FeedView
        feed={feed({ columns: [{ label: "Request", type: "text", key: "title", subKey: "note" }, { label: "Status", type: "badge", key: "state" }] })}
        rows={rows}
      />
    );
    expect([...container.querySelectorAll("th")].map((th) => th.textContent)).toEqual(["Request", "Status"]);
    expect(container.querySelector("tbody tr")!.textContent).toContain("The Matrix");
    expect(container.querySelector("tbody tr")!.textContent).toContain("awaiting approval");
  });

  test("data is always text, never markup", () => {
    const { container } = render(<FeedView feed={feed({ columns: [{ label: "T", type: "text", key: "title" }] })} rows={rows} />);
    expect(container.querySelector("tbody img")).toBeNull();
    expect(rowTexts(container)[1]).toBe("<img src=x onerror=alert(1)>");
  });

  test("link columns only link to http(s) urls and open in a new tab", () => {
    const { container } = render(
      <FeedView feed={feed({ columns: [{ label: "T", type: "link", key: "title", hrefKey: "url" }] })} rows={rows} />
    );
    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://seerr.test/movie/603", "https://seerr.test/movie/1"]);
    expect(links[0].getAttribute("target")).toBe("_blank");
    expect(links[0].getAttribute("rel")).toContain("noopener");
  });

  test("image columns only load http(s) images", () => {
    const { container } = render(
      <FeedView feed={feed({ columns: [{ label: "P", type: "image", key: "url" }] })} rows={rows} />
    );
    expect([...container.querySelectorAll("img")].map((i) => i.getAttribute("src"))).toEqual([
      "https://seerr.test/movie/603",
      "https://seerr.test/movie/1",
    ]);
  });

  test("progress columns clamp to 0-100 and show a dash for non-numbers", () => {
    const { container } = render(<FeedView feed={feed({ columns: [{ label: "%", type: "progress", key: "pct" }] })} rows={rows} />);
    expect(rowTexts(container)).toEqual(["40%", "100%", "–"]);
  });

  test("switch styles change a cell's style by the row's value", () => {
    const { container } = render(
      <FeedView
        feed={feed({
          columns: [
            {
              label: "S",
              type: "badge",
              key: "state",
              style: { base: "color: grey", switchKey: "state", cases: [{ equals: "pending", style: "color: orange" }] },
            },
          ],
        })}
        rows={rows}
      />
    );
    const badges = [...container.querySelectorAll<HTMLElement>("tbody [data-badge]")];
    expect(badges[0].style.color).toBe("orange");
    expect(badges[1].style.color).toBe("grey");
  });

  test("filter buttons toggle on click and focus on double-click", () => {
    const { container } = render(
      <FeedView
        feed={feed({
          columns: [{ label: "T", type: "text", key: "title" }],
          filterButtons: [
            { label: "pending", key: "state", equals: "pending", showCount: true },
            { label: "approved", key: "state", equals: "approved", showCount: true },
          ],
        })}
        rows={rows}
      />
    );
    const [pending, approved] = [...container.querySelectorAll<HTMLButtonElement>("[data-filter-button]")];
    expect(pending.textContent).toBe("1 pending");
    expect(approved.textContent).toBe("2 approved");

    fire.click(pending);
    expect(rowTexts(container)).toEqual(["The Matrix"]);
    expect(pending.getAttribute("aria-pressed")).toBe("true");

    fire.click(approved);
    expect(rowTexts(container)).toHaveLength(3);

    fire.dblClick(approved);
    expect(rowTexts(container)).toEqual(["<img src=x onerror=alert(1)>", "Dune"]);
    expect(pending.getAttribute("aria-pressed")).toBe("false");

    fire.click(approved);
    expect(rowTexts(container)).toHaveLength(3);
  });

  test("a feed with no columns falls back to the simple title/subtitle list", () => {
    const { container } = render(<FeedView feed={feed({})} rows={[{ title: "A", subtitle: "b" }]} />);
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("b");
  });

  test("says so when there's nothing to show", () => {
    const { container } = render(<FeedView feed={feed({ columns: [{ label: "T", type: "text", key: "title" }] })} rows={[]} />);
    expect(container.textContent).toContain("No items");
  });
});
