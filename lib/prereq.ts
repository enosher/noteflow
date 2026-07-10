import { WEAK_TOPIC_THRESHOLD, WEAK_TOPIC_MIN_ATTEMPTS } from "@/lib/weak-topics";

// Graph reasoning for the concept map. Kept pure and Supabase-free, same
// reason as sm2.ts and recommender.ts: cycles and gating are logic bugs,
// and logic bugs belong in a millisecond-fast unit test, not a live DB.

export type PrereqEdge = {
  topic_id: string;
  prerequisite_topic_id: string;
};

export type TopicMastery = {
  topic_id: string;
  accuracy: number; // 0-1
  attempts: number;
};

// Would adding this edge create a cycle? BFS from the proposed
// prerequisite's own prerequisites back towards topicId. Checked at write
// time rather than tolerated at read time, since a cyclic prerequisite
// graph is meaningless. Reject early with a clear message.
export function wouldCreateCycle(
  edges: PrereqEdge[],
  topicId: string,
  prerequisiteId: string
): boolean {
  if (topicId === prerequisiteId) return true;
  const prereqsOf = new Map<string, string[]>();
  for (const e of edges) {
    const list = prereqsOf.get(e.topic_id) ?? [];
    list.push(e.prerequisite_topic_id);
    prereqsOf.set(e.topic_id, list);
  }
  const queue = [...(prereqsOf.get(prerequisiteId) ?? [])];
  const seen = new Set<string>(queue);
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === topicId) return true;
    for (const next of prereqsOf.get(cur) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

// The gate the recommender reads. A topic is "blocked" when a direct
// prerequisite is weak, using the same weak definition as everywhere else
// in the app (imported, not redefined). Unattempted prerequisites never block:
// punishing users for not having started yet would make a new module
// feel broken from the first click.
export function blockedTopics(
  edges: PrereqEdge[],
  mastery: TopicMastery[]
): Set<string> {
  const byId = new Map(mastery.map((m) => [m.topic_id, m]));
  const blocked = new Set<string>();
  for (const e of edges) {
    const prereq = byId.get(e.prerequisite_topic_id);
    if (
      prereq &&
      prereq.attempts >= WEAK_TOPIC_MIN_ATTEMPTS &&
      prereq.accuracy < WEAK_TOPIC_THRESHOLD
    ) {
      blocked.add(e.topic_id);
    }
  }
  return blocked;
}

// Layers topics into levels for the graph layout: a topic with no
// prerequisites sits at level 0; everything else sits one level past the
// deepest of its own prerequisites. `seen` guards a malformed edge set
// (shouldn't happen, since writes are cycle-checked) from infinite recursion.
export function topologicalLevels(
  topicIds: string[],
  edges: PrereqEdge[]
): Map<string, number> {
  const prereqsOf = new Map<string, string[]>();
  for (const id of topicIds) prereqsOf.set(id, []);
  for (const e of edges) {
    if (!prereqsOf.has(e.topic_id)) prereqsOf.set(e.topic_id, []);
    prereqsOf.get(e.topic_id)!.push(e.prerequisite_topic_id);
  }

  const memo = new Map<string, number>();
  function levelOf(id: string, seen: Set<string>): number {
    if (memo.has(id)) return memo.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const prereqs = prereqsOf.get(id) ?? [];
    const level =
      prereqs.length === 0
        ? 0
        : 1 + Math.max(...prereqs.map((p) => levelOf(p, seen)));
    memo.set(id, level);
    return level;
  }

  for (const id of topicIds) levelOf(id, new Set());
  return memo;
}
