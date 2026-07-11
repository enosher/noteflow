import { describe, it, expect } from "vitest";
import {
  DEFAULT_PARAMS,
  graphBounds,
  reachableFrom,
  seedLayout,
  stepSimulation,
} from "./graph-layout";

const edge = (t: string, p: string) => ({
  topic_id: t,
  prerequisite_topic_id: p,
});

// Run the sim the way the view does: decaying alpha until settled.
function settle(nodes: ReturnType<typeof seedLayout>, edges: ReturnType<typeof edge>[]) {
  let alpha = 1;
  for (let i = 0; i < 500; i++) {
    const moved = stepSimulation(nodes, edges, alpha, DEFAULT_PARAMS);
    alpha *= 0.975;
    if (moved < 0.05 || alpha < 0.005) break;
  }
  return nodes;
}

describe("seedLayout", () => {
  it("places roots in column 0 and dependents one column per level", () => {
    const nodes = seedLayout(["A", "B", "C"], [edge("B", "A"), edge("C", "B")]);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("A")!.x).toBe(0);
    expect(byId.get("B")!.x).toBe(DEFAULT_PARAMS.columnWidth);
    expect(byId.get("C")!.x).toBe(2 * DEFAULT_PARAMS.columnWidth);
  });

  it("is deterministic across calls", () => {
    const edges = [edge("B", "A")];
    const first = seedLayout(["A", "B", "C"], edges);
    const second = seedLayout(["A", "B", "C"], edges);
    expect(second).toEqual(first);
  });
});

describe("stepSimulation", () => {
  it("separates coincident nodes past the collision radius", () => {
    // Force the worst case: two nodes on the exact same spot.
    const nodes = seedLayout(["A", "B"], []);
    nodes[1].x = nodes[0].x;
    nodes[1].y = nodes[0].y;
    settle(nodes, []);
    const d = Math.hypot(nodes[0].x - nodes[1].x, nodes[0].y - nodes[1].y);
    expect(d).toBeGreaterThanOrEqual(DEFAULT_PARAMS.collideRadius * 0.95);
  });

  it("keeps a prerequisite strictly left of its dependent after settling", () => {
    // The layout's one hard promise: the graph reads left-to-right.
    const nodes = settle(
      seedLayout(["A", "B", "C"], [edge("B", "A"), edge("C", "B")]),
      [edge("B", "A"), edge("C", "B")]
    );
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("A")!.x).toBeLessThan(byId.get("B")!.x);
    expect(byId.get("B")!.x).toBeLessThan(byId.get("C")!.x);
  });

  it("never moves a pinned node", () => {
    const edges = [edge("B", "A")];
    const nodes = seedLayout(["A", "B"], edges);
    const pinned = nodes.find((n) => n.id === "A")!;
    pinned.x = 123;
    pinned.y = 456;
    for (let i = 0; i < 50; i++) {
      stepSimulation(nodes, edges, 1, DEFAULT_PARAMS, "A");
    }
    expect(pinned.x).toBe(123);
    expect(pinned.y).toBe(456);
  });

  it("settles instead of oscillating forever", () => {
    const edges = [edge("B", "A"), edge("C", "A"), edge("D", "B"), edge("D", "C")];
    const nodes = seedLayout(["A", "B", "C", "D"], edges);
    let alpha = 1;
    let moved = Infinity;
    for (let i = 0; i < 500 && moved >= 0.05; i++) {
      moved = stepSimulation(nodes, edges, alpha, DEFAULT_PARAMS);
      alpha *= 0.975;
    }
    expect(moved).toBeLessThan(0.05);
  });

  it("keeps the settled layout inside a sane bounding box", () => {
    // Unbalanced forces would fling nodes to infinity; pin down that they don't.
    const edges = [edge("B", "A"), edge("C", "A"), edge("D", "B")];
    const nodes = settle(seedLayout(["A", "B", "C", "D"], edges), edges);
    const b = graphBounds(nodes, 0);
    expect(b.maxX - b.minX).toBeLessThan(2000);
    expect(b.maxY - b.minY).toBeLessThan(2000);
  });
});

describe("graphBounds", () => {
  it("pads the min/max of node positions", () => {
    const nodes = seedLayout(["A", "B"], [edge("B", "A")]);
    const b = graphBounds(nodes, 10);
    expect(b.minX).toBe(-10);
    expect(b.maxX).toBe(DEFAULT_PARAMS.columnWidth + 10);
  });

  it("returns a zero box for an empty graph", () => {
    expect(graphBounds([], 50)).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });
});

describe("reachableFrom", () => {
  // Diamond: D requires B and C, both require A.
  const edges = [edge("B", "A"), edge("C", "A"), edge("D", "B"), edge("D", "C")];

  it("walks the full ancestor chain, not just direct prerequisites", () => {
    expect(reachableFrom(edges, "D", "up")).toEqual(new Set(["A", "B", "C"]));
  });

  it("walks the full dependent chain", () => {
    expect(reachableFrom(edges, "A", "down")).toEqual(new Set(["B", "C", "D"]));
  });

  it("excludes the starting node and unrelated nodes", () => {
    const up = reachableFrom(edges, "B", "up");
    expect(up.has("B")).toBe(false);
    expect(up.has("C")).toBe(false); // sibling, not ancestor
    expect(up).toEqual(new Set(["A"]));
  });

  it("returns an empty set for a node with no edges", () => {
    expect(reachableFrom(edges, "Z", "up").size).toBe(0);
  });
});
