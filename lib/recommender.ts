import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getTopicAccuracy } from "@/lib/weak-topics";

// Re-exported so the dashboard only needs one import for both accuracy
// and recommendations, rather than going into two different lib files.
export { getTopicAccuracy };

// Weights must sum to 1. Topic weakness gets the most signal (0.4) because
// it's the clearest indicator of where study time is most needed.
// Why we chose the values is documented in the README "Recommendation Algorithm" section.
export const WEIGHTS = {
  topicWeakness: 0.4,
  recencyBoost: 0.2,
  mistakeRecency: 0.3,
  difficultyMatch: 0.1,
};

const RECENCY_WINDOW_DAYS = 7;

export function topicWeaknessScore(accuracy: number | undefined): number {
  // No attempts yet means we don't know; so 0.5 (neutral) rather
  // than 0 (strong) or 1 (weak).
  if (accuracy === undefined) return 0.5;
  return 1 - accuracy;
}

export function recencyBoostScore(lastAttemptedAt: string | null): number {
  // Never attempted is the most overdue a question can be.
  if (!lastAttemptedAt) return 1;
  const daysSince = (Date.now() - new Date(lastAttemptedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= RECENCY_WINDOW_DAYS ? 1 : 0;
}

export function mistakeRecencyScore(lastAttemptCorrect: boolean | null): number {
  if (lastAttemptCorrect === null) return 0; // no history, no mistake signal
  return lastAttemptCorrect ? 0 : 1;
}

export function difficultyMatchScore(questionDifficulty: number, userAvgDifficulty: number): number {
  // Max gap between any two difficulty values is 4 (1 vs 5), so dividing by 4
  // keeps this score in [0, 1].
  return 1 - Math.abs(questionDifficulty - userAvgDifficulty) / 4;
}

export function scoreQuestion(input: {
  topicAccuracy: number | undefined;
  lastAttemptedAt: string | null;
  lastAttemptCorrect: boolean | null;
  questionDifficulty: number;
  userAvgDifficulty: number;
}): number {
  return (
    WEIGHTS.topicWeakness * topicWeaknessScore(input.topicAccuracy) +
    WEIGHTS.recencyBoost * recencyBoostScore(input.lastAttemptedAt) +
    WEIGHTS.mistakeRecency * mistakeRecencyScore(input.lastAttemptCorrect) +
    WEIGHTS.difficultyMatch * difficultyMatchScore(input.questionDifficulty, input.userAvgDifficulty)
  );
}

export type Recommendation = {
  question_id: string;
  prompt: string;
  topic_id: string;
  topic_name: string;
  module_id: string;
};

export async function getRecommendedQuestion(
  supabase: SupabaseClient<Database>
): Promise<Recommendation | null> {
  // RLS on questions scopes this to modules the user owns; so no user_id filter needed.
  const { data: questions } = await supabase
    .from("questions")
    .select("id, prompt, difficulty, topic_id, topics(id, name, module_id)");

  if (!questions || questions.length === 0) return null;

  const topicStats = await getTopicAccuracy(supabase);
  const accuracyByTopic = new Map(topicStats.map((t) => [t.topic_id, t.accuracy]));

  // Fetch uses newest so the first hit per question in the loop
  // below is automatically the most recent one; no sorting needed later.
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("question_id, is_correct, attempted_at")
    .order("attempted_at", { ascending: false });

  const lastAttemptByQuestion = new Map<string, { at: string; correct: boolean }>();
  for (const a of attempts ?? []) {
    if (!lastAttemptByQuestion.has(a.question_id)) {
      lastAttemptByQuestion.set(a.question_id, { at: a.attempted_at, correct: a.is_correct });
    }
  }

  const userAvgDifficulty = questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length;

  let best: { question: (typeof questions)[number]; score: number } | null = null;

  for (const q of questions) {
    const last = lastAttemptByQuestion.get(q.id);
    const score = scoreQuestion({
      topicAccuracy: accuracyByTopic.get(q.topic_id),
      lastAttemptedAt: last?.at ?? null,
      lastAttemptCorrect: last ? last.correct : null,
      questionDifficulty: q.difficulty,
      userAvgDifficulty,
    });
    if (!best || score > best.score) best = { question: q, score };
  }

  if (!best) return null;

  // Supabase types nested embeds conservatively - the join always returns
  // exactly one topic per question, but the generated type allows for an
  // array or null. Cast is used here.
  const topic = best.question.topics as unknown as { id: string; name: string; module_id: string } | null;

  return {
    question_id: best.question.id,
    prompt: best.question.prompt,
    topic_id: best.question.topic_id,
    topic_name: topic?.name ?? "",
    module_id: topic?.module_id ?? "",
  };
}