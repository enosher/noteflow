import { WEAK_TOPIC_THRESHOLD, WEAK_TOPIC_MIN_ATTEMPTS } from "@/lib/weak-topics";

// The logic behind the concept map. Kept simple and free of any database
// calls, same as sm2.ts and recommender.ts, so bugs like a broken loop
// or blocking rule show up in a fast test instead of a live database.

export type PrereqEdge = {
  topic_id: string;
  prerequisite_topic_id: string;
};

export type TopicMastery = {
  topic_id: string;
  accuracy: number; // 0-1
  attempts: number;
};

// Would adding this edge create a loop? Walks backward through the
// proposed prerequisite's own prerequisites, checking if it leads back
// to topicId. Checked before saving, since a looping chain makes no sense.
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

// The gate the recommender reads: a topic is "blocked" when a direct
// prerequisite is weak (same definition used everywhere else). Unattempted
// prerequisites never block, so a new module doesn't feel broken on click one.
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

// Sorts topics into levels for the graph layout: no prerequisites means
// level 0, otherwise one level deeper than its deepest prerequisite.
// `seen` stops this from looping forever if the edges are ever broken.
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
