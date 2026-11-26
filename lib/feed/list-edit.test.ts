import { describe, expect, test } from "vitest";
import { moveItem, removeAt, replaceAt } from "./list-edit";

describe("list edits", () => {
  const list = ["a", "b", "c"] as const;

  test("moveItem moves up and down and leaves the original alone", () => {
    expect(moveItem(list, 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(list, 1, 1)).toEqual(["a", "c", "b"]);
    expect(list).toEqual(["a", "b", "c"]);
  });

  test("moveItem past either end changes nothing", () => {
    expect(moveItem(list, 0, -1)).toEqual(["a", "b", "c"]);
    expect(moveItem(list, 2, 1)).toEqual(["a", "b", "c"]);
  });

  test("replaceAt and removeAt return new lists", () => {
    expect(replaceAt(list, 1, "x")).toEqual(["a", "x", "c"]);
    expect(removeAt(list, 0)).toEqual(["b", "c"]);
    expect(list).toEqual(["a", "b", "c"]);
  });
});
