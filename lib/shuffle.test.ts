import { describe, it, expect } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("preserves every element, same multiset", () => {
    const input = ["a", "b", "c", "d"];
    const result = shuffle(input);
    expect(result.slice().sort()).toEqual(input.slice().sort());
  });

  it("returns an array of the same length", () => {
    expect(shuffle([1, 2, 3]).length).toBe(3);
  });

  it("handles an empty array", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("handles a single-element array", () => {
    expect(shuffle([1])).toEqual([1]);
  });

  it("produces more than one distinct order across many runs", () => {
    // Not a statistical randomness test - just a sanity check that this
    // isn't accidentally an identity function or a fixed permutation.
    const orders = new Set<string>();
    for (let i = 0; i < 50; i++) {
      orders.add(shuffle([1, 2, 3, 4, 5, 6]).join(","));
    }
    expect(orders.size).toBeGreaterThan(1);
  });
});
