import { describe, it, expect } from "vitest";
import { isWeakTopic, WEAK_TOPIC_THRESHOLD, WEAK_TOPIC_MIN_ATTEMPTS } from "./weak-topics";

describe("isWeakTopic", () => {
  it("flags low accuracy once there are enough attempts", () => {
    expect(isWeakTopic(0.5, 3)).toBe(true);
  });

  it("does not flag low accuracy with too few attempts", () => {
    expect(isWeakTopic(0, 2)).toBe(false);
  });

  it("does not flag high accuracy regardless of attempt count", () => {
    expect(isWeakTopic(0.9, 10)).toBe(false);
  });

  it("accuracy exactly at the threshold is not weak", () => {
    expect(isWeakTopic(WEAK_TOPIC_THRESHOLD, WEAK_TOPIC_MIN_ATTEMPTS)).toBe(false);
  });

  it("just below the threshold, with the minimum attempts, is weak", () => {
    expect(isWeakTopic(WEAK_TOPIC_THRESHOLD - 0.01, WEAK_TOPIC_MIN_ATTEMPTS)).toBe(true);
  });
});