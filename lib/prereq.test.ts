import { describe, it, expect } from "vitest";
import { wouldCreateCycle, blockedTopics, topologicalLevels } from "./prereq";

const edge = (t: string, p: string) => ({
  topic_id: t,
  prerequisite_topic_id: p,
});

describe("wouldCreateCycle", () => {
  it("rejects a self-edge", () => {
    expect(wouldCreateCycle([], "A", "A")).toBe(true);
  });

  it("allows a simple chain", () => {
    // B requires A already; adding "C requires B" is fine
    expect(wouldCreateCycle([edge("B", "A")], "C", "B")).toBe(false);
  });

  it("rejects a direct 2-cycle", () => {
    // B requires A; adding "A requires B" closes the loop
    expect(wouldCreateCycle([edge("B", "A")], "A", "B")).toBe(true);
  });

  it("rejects a transitive 3-cycle", () => {
    // C->B->A exists; adding "A requires C" loops through two hops
    expect(
      wouldCreateCycle([edge("C", "B"), edge("B", "A")], "A", "C")
    ).toBe(true);
  });
});

describe("blockedTopics", () => {
  const m = (id: string, accuracy: number, attempts: number) => ({
    topic_id: id,
    accuracy,
    attempts,
  });

  it("blocks a topic whose prerequisite is weak", () => {
    const blocked = blockedTopics(
      [edge("Polymorphism", "Inheritance")],
      [m("Inheritance", 0.4, 5)]
    );
    expect(blocked.has("Polymorphism")).toBe(true);
  });

  it("does not block when prerequisite is strong", () => {
    const blocked = blockedTopics(
      [edge("Polymorphism", "Inheritance")],
      [m("Inheritance", 0.9, 5)]
    );
    expect(blocked.size).toBe(0);
  });

  it("boundary: accuracy exactly 0.60 is NOT weak", () => {
    const blocked = blockedTopics([edge("B", "A")], [m("A", 0.6, 5)]);
    expect(blocked.size).toBe(0);
  });

  it("boundary: attempts exactly 3 with low accuracy IS weak", () => {
    const blocked = blockedTopics([edge("B", "A")], [m("A", 0.5, 3)]);
    expect(blocked.has("B")).toBe(true);
  });

  it("unattempted prerequisites never block", () => {
    const blocked = blockedTopics([edge("B", "A")], [m("A", 0, 0)]);
    expect(blocked.size).toBe(0);
  });
});

describe("topologicalLevels", () => {
  it("puts a topic with no prerequisites at level 0", () => {
    const levels = topologicalLevels(["A"], []);
    expect(levels.get("A")).toBe(0);
  });

  it("places a topic one level past its prerequisite", () => {
    const levels = topologicalLevels(["A", "B"], [edge("B", "A")]);
    expect(levels.get("A")).toBe(0);
    expect(levels.get("B")).toBe(1);
  });

  it("uses the deepest prerequisite when a topic has more than one", () => {
    // C requires both A (level 0) and B (level 1) -> C sits at level 2
    const levels = topologicalLevels(
      ["A", "B", "C"],
      [edge("B", "A"), edge("C", "A"), edge("C", "B")]
    );
    expect(levels.get("C")).toBe(2);
  });
});
