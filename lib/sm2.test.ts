import { describe, it, expect } from "vitest";
import {
  INITIAL_STATE,
  nextReviewState,
  qualityFromCorrect,
  nextDueDate,
} from "./sm2";

describe("qualityFromCorrect", () => {
  it("maps correct to 4 and incorrect to 2", () => {
    expect(qualityFromCorrect(true)).toBe(4);
    expect(qualityFromCorrect(false)).toBe(2);
  });
});

describe("nextReviewState - success path", () => {
  it("first success: interval 1 day", () => {
    const s = nextReviewState(INITIAL_STATE, 4);
    expect(s.intervalDays).toBe(1);
    expect(s.repetitions).toBe(1);
  });

  it("second success: interval 6 days", () => {
    const s1 = nextReviewState(INITIAL_STATE, 4);
    const s2 = nextReviewState(s1, 4);
    expect(s2.intervalDays).toBe(6);
    expect(s2.repetitions).toBe(2);
  });

  it("third success: interval = round(prev interval * ease)", () => {
    let s = nextReviewState(INITIAL_STATE, 4);
    s = nextReviewState(s, 4);
    const s3 = nextReviewState(s, 4);
    expect(s3.intervalDays).toBe(Math.round(6 * s.easeFactor));
    expect(s3.repetitions).toBe(3);
  });

  it("quality 5 increases ease, quality 3 decreases it", () => {
    expect(nextReviewState(INITIAL_STATE, 5).easeFactor).toBeGreaterThan(2.5);
    expect(nextReviewState(INITIAL_STATE, 3).easeFactor).toBeLessThan(2.5);
  });
});

describe("nextReviewState - failure path (boundary: quality < 3)", () => {
  it("quality 2 resets repetitions and sets interval to 1", () => {
    const mature = { easeFactor: 2.6, intervalDays: 30, repetitions: 5 };
    const s = nextReviewState(mature, 2);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    expect(s.easeFactor).toBe(2.6); // failure does NOT touch ease in SM-2
  });

  it("quality 3 is the lowest passing grade (boundary value)", () => {
    const s = nextReviewState(INITIAL_STATE, 3);
    expect(s.repetitions).toBe(1); // passes
  });
});

describe("ease factor floor (boundary: 1.3)", () => {
  it("never drops below 1.3 no matter how many hard passes", () => {
    let s = { easeFactor: 1.32, intervalDays: 6, repetitions: 2 };
    for (let i = 0; i < 10; i++) s = nextReviewState(s, 3);
    expect(s.easeFactor).toBe(1.3);
  });
});

describe("input validation (equivalence class: out-of-range quality)", () => {
  it("rejects quality outside 0-5", () => {
    expect(() => nextReviewState(INITIAL_STATE, 6)).toThrow();
    expect(() => nextReviewState(INITIAL_STATE, -1)).toThrow();
  });
});

describe("nextDueDate", () => {
  it("adds whole days", () => {
    const from = new Date("2026-07-10T08:00:00Z");
    expect(nextDueDate(from, 6).toISOString()).toBe(
      "2026-07-16T08:00:00.000Z"
    );
  });
});