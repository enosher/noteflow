import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// The attempt floor stops one lucky/unlucky guess from flagging a topic.
// This is documented in the README, as suggested by milestone 1 feedback.
export const WEAK_TOPIC_THRESHOLD = 0.6;
export const WEAK_TOPIC_MIN_ATTEMPTS = 3;

export type TopicAccuracy = {
  topic_id: string;
  module_id: string;
  topic_name: string;
  accuracy: number; // 0-1
  attempts: number;
  is_weak: boolean;
};

export function isWeakTopic(accuracy: number, attempts: number): boolean {
  return attempts >= WEAK_TOPIC_MIN_ATTEMPTS && accuracy < WEAK_TOPIC_THRESHOLD;
}


 // Computes per-topic accuracy for the user based on their quiz_attempts.
 // RLS on quiz_attempts already scopes the query to the current user, so no user_id filter is used here.
 
export async function getTopicAccuracy(
  supabase: SupabaseClient<Database>
): Promise<TopicAccuracy[]> {
  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("question_id, is_correct");

  if (attemptsError || !attempts || attempts.length === 0) return [];

  // Deduplicate question IDs before the second query; no point fetching
  // the same question row twice if it's been answered multiple times.
  const questionIds = [...new Set(attempts.map((a) => a.question_id))];
  const { data: questions } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("id", questionIds);

  const topicIdByQuestion = new Map((questions ?? []).map((q) => [q.id, q.topic_id]));

  // Go thru attempts once and accumulate correct/total counts per topic.
  const byTopic = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const topicId = topicIdByQuestion.get(a.question_id);
    if (!topicId) continue; // question deleted after the attempt was recorded
    const entry = byTopic.get(topicId) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (a.is_correct) entry.correct += 1;
    byTopic.set(topicId, entry);
  }

  if (byTopic.size === 0) return [];

  const topicIds = [...byTopic.keys()];
  const { data: topics } = await supabase
    .from("topics")
    .select("id, name, module_id")
    .in("id", topicIds);

  return (topics ?? []).map((t) => {
    const { correct, total } = byTopic.get(t.id)!;
    const accuracy = correct / total;
    return {
      topic_id: t.id,
      module_id: t.module_id,
      topic_name: t.name,
      accuracy,
      attempts: total,
      is_weak: isWeakTopic(accuracy, total),
    };
  });
}