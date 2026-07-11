import { topologicalLevels, type PrereqEdge } from "@/lib/prereq";

// Force-directed layout for the concept graph, hand-rolled on purpose.
// Pure geometry, no DOM or Supabase - every force is unit-testable, same
// philosophy as prereq.ts. The one promise a generic library (d3-force,
// react-flow) won't make: each node's x is anchored to its topological
// level, so the DAG always reads left-to-right; physics only negotiates y.

export type SimNode = {
  id: string;
  level: number; // topological depth, fixed for the node's lifetime
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type SimParams = {
  columnWidth: number; // horizontal distance between topological levels
  rowGap: number; // initial vertical spacing when seeding
  linkDistance: number; // spring rest length for prerequisite edges
  linkStrength: number;
  repulsion: number; // pairwise push, scaled by 1/distance^2
  collideRadius: number; // hard minimum separation between node centers
  columnStrength: number; // pull back toward the level's x column
  centerStrength: number; // gentle pull toward the vertical centroid
  damping: number; // velocity retained per tick (0-1)
};

export const DEFAULT_PARAMS: SimParams = {
  columnWidth: 210,
  rowGap: 120,
  linkDistance: 190,
  linkStrength: 0.04,
  repulsion: 42000,
  collideRadius: 95, // roomy enough that a two-line label clears the node below
  columnStrength: 0.12,
  centerStrength: 0.012,
  damping: 0.6,
};

// Seed each node at its topological column, stacked by insertion order.
// Deterministic on purpose: reloads and tests get the same picture.
export function seedLayout(
  topicIds: string[],
  edges: PrereqEdge[],
  params: SimParams = DEFAULT_PARAMS
): SimNode[] {
  const levels = topologicalLevels(topicIds, edges);
  const countAtLevel = new Map<number, number>();

  return topicIds.map((id) => {
    const level = levels.get(id) ?? 0;
    const row = countAtLevel.get(level) ?? 0;
    countAtLevel.set(level, row + 1);
    return {
      id,
      level,
      x: level * params.columnWidth,
      y: row * params.rowGap,
      vx: 0,
      vy: 0,
    };
  });
}

// One physics tick. Mutates in place (cloning per frame is GC noise) and
// returns max displacement so the caller can stop once settled. `alpha` is
// annealing temperature - bold early, nudges late. `pinnedId` is the node
// under the pointer: dragged, never pushed.
export function stepSimulation(
  nodes: SimNode[],
  edges: PrereqEdge[],
  alpha: number,
  params: SimParams = DEFAULT_PARAMS,
  pinnedId?: string | null
): number {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Repulsion + collision in one symmetric O(n^2) pass - no net drift.
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      let dy = b.y - a.y;
      let d2 = dx * dx + dy * dy;
      if (d2 === 0) {
        // Coincident nodes get a deterministic shove, not a random one.
        dy = j - i;
        d2 = dy * dy;
      }
      const d = Math.sqrt(d2);

      const push = (params.repulsion / d2) * alpha;
      const fx = (dx / d) * push;
      const fy = (dy / d) * push;
      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;

      // Overlap is resolved positionally, so labels never stack mid-animation.
      if (d < params.collideRadius) {
        const overlap = (params.collideRadius - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        if (a.id !== pinnedId) {
          a.x -= ux * overlap;
          a.y -= uy * overlap;
        }
        if (b.id !== pinnedId) {
          b.x += ux * overlap;
          b.y += uy * overlap;
        }
      }
    }
  }

  // Springs pull edges toward rest length. The column anchor wins the x
  // tug-of-war, so springs mostly organise y: related topics drift together.
  for (const e of edges) {
    const from = byId.get(e.prerequisite_topic_id);
    const to = byId.get(e.topic_id);
    if (!from || !to) continue; // stale edge
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const stretch = (d - params.linkDistance) * params.linkStrength * alpha;
    const fx = (dx / d) * stretch;
    const fy = (dy / d) * stretch;
    from.vx += fx;
    from.vy += fy;
    to.vx -= fx;
    to.vy -= fy;
  }

  // Column anchor + vertical centering, then integrate.
  const meanY =
    nodes.reduce((sum, n) => sum + n.y, 0) / Math.max(nodes.length, 1);

  let maxMove = 0;
  for (const n of nodes) {
    if (n.id === pinnedId) {
      // The pointer owns this node; zeroed velocity prevents a release slingshot.
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    n.vx += (n.level * params.columnWidth - n.x) * params.columnStrength * alpha;
    n.vy += (meanY - n.y) * params.centerStrength * alpha;

    n.vx *= params.damping;
    n.vy *= params.damping;
    n.x += n.vx;
    n.y += n.vy;
    maxMove = Math.max(maxMove, Math.abs(n.vx), Math.abs(n.vy));
  }

  return maxMove;
}

// Padded bounding box: fit-to-view, minimap, and "didn't explode" tests.
export function graphBounds(
  nodes: SimNode[],
  pad: number
): { minX: number; minY: number; maxX: number; maxY: number } {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x);
    maxY = Math.max(maxY, n.y);
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

// Every topic reachable from `id`: "up" = ancestors, "down" = dependents.
// Powers hover highlighting - the full chain, not just direct neighbours.
export function reachableFrom(
  edges: PrereqEdge[],
  id: string,
  direction: "up" | "down"
): Set<string> {
  const next = new Map<string, string[]>();
  for (const e of edges) {
    const [from, to] =
      direction === "up"
        ? [e.topic_id, e.prerequisite_topic_id]
        : [e.prerequisite_topic_id, e.topic_id];
    const list = next.get(from) ?? [];
    list.push(to);
    next.set(from, list);
  }
  const seen = new Set<string>();
  const queue = [...(next.get(id) ?? [])];
  for (const q of queue) seen.add(q);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of next.get(cur) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen;
}
