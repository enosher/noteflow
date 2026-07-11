import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getTopicAccuracy } from "@/lib/weak-topics";
import { blockedTopics } from "@/lib/prereq";

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

// A blocked topic (weak prerequisite, per lib/prereq.blockedTopics) gets
// its score halved rather than excluded, since a module where every topic
// sits behind one weak link still needs something to recommend.
export const BLOCKED_PENALTY_FACTOR = 0.5;

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
  // Max gap between any two difficulty values is 4 (1 vs 5), so dividing
  // by 4 keeps this score between 0 and 1.
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

// Halves the score for a blocked topic. Kept as its own function, not
// inlined, so it's just as easy to test on its own as the four scoring
// functions above.
export function applyBlockedPenalty(score: number, isBlocked: boolean): number {
  return isBlocked ? score * BLOCKED_PENALTY_FACTOR : score;
}

export type ScoreTerm = {
  label: string;
  rawScore: number; // 0-1, before the weight is applied
  weight: number;
  weighted: number; // rawScore * weight - this is what actually adds to the total
};

export type ScoreBreakdown = {
  terms: ScoreTerm[];
  total: number;
};

// Same four terms as scoreQuestion, itemised instead of summed, so the
// debug UI can show a recommendation is never a black box. `total` is
// summed directly rather than re-calling scoreQuestion; a test pins them to match.
export function getScoreBreakdown(input: {
  topicAccuracy: number | undefined;
  lastAttemptedAt: string | null;
  lastAttemptCorrect: boolean | null;
  questionDifficulty: number;
  userAvgDifficulty: number;
}): ScoreBreakdown {
  const raw = {
    topicWeakness: topicWeaknessScore(input.topicAccuracy),
    recencyBoost: recencyBoostScore(input.lastAttemptedAt),
    mistakeRecency: mistakeRecencyScore(input.lastAttemptCorrect),
    difficultyMatch: difficultyMatchScore(input.questionDifficulty, input.userAvgDifficulty),
  };

  const terms: ScoreTerm[] = [
    {
      label: "Topic weakness",
      rawScore: raw.topicWeakness,
      weight: WEIGHTS.topicWeakness,
      weighted: WEIGHTS.topicWeakness * raw.topicWeakness,
    },
    {
      label: "Recency boost",
      rawScore: raw.recencyBoost,
      weight: WEIGHTS.recencyBoost,
      weighted: WEIGHTS.recencyBoost * raw.recencyBoost,
    },
    {
      label: "Mistake recency",
      rawScore: raw.mistakeRecency,
      weight: WEIGHTS.mistakeRecency,
      weighted: WEIGHTS.mistakeRecency * raw.mistakeRecency,
    },
    {
      label: "Difficulty match",
      rawScore: raw.difficultyMatch,
      weight: WEIGHTS.difficultyMatch,
      weighted: WEIGHTS.difficultyMatch * raw.difficultyMatch,
    },
  ];

  const total = terms.reduce((sum, t) => sum + t.weighted, 0);
  return { terms, total };
}

export type Recommendation = {
  question_id: string;
  prompt: string;
  topic_id: string;
  topic_name: string;
  module_id: string;
  breakdown: ScoreBreakdown;
  blocked: boolean; // true if topic_id is gated by a weak prerequisite
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

  // Prerequisite edges across every module the user owns (RLS scopes this
  // the same way it scopes questions above), so gating is computed once
  // rather than per-module.
  const { data: edges } = await supabase
    .from("topic_prerequisites")
    .select("topic_id, prerequisite_topic_id");
  const blocked = blockedTopics(
    edges ?? [],
    topicStats.map((t) => ({ topic_id: t.topic_id, accuracy: t.accuracy, attempts: t.attempts }))
  );

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

  let best: {
    question: (typeof questions)[number];
    score: number;
    input: Parameters<typeof getScoreBreakdown>[0];
  } | null = null;

  for (const q of questions) {
    const last = lastAttemptByQuestion.get(q.id);
    const input = {
      topicAccuracy: accuracyByTopic.get(q.topic_id),
      lastAttemptedAt: last?.at ?? null,
      lastAttemptCorrect: last ? last.correct : null,
      questionDifficulty: q.difficulty,
      userAvgDifficulty,
    };
    const score = applyBlockedPenalty(scoreQuestion(input), blocked.has(q.topic_id));
    if (!best || score > best.score) best = { question: q, score, input };
  }

  if (!best) return null;

  // Supabase's generated types allow this joined topic to be an array or
  // null, even though it's always exactly one topic per question here.
  // The cast below just tells TypeScript the real shape.
  const topic = best.question.topics as unknown as { id: string; name: string; module_id: string } | null;

  return {
    question_id: best.question.id,
    prompt: best.question.prompt,
    topic_id: best.question.topic_id,
    topic_name: topic?.name ?? "",
    module_id: topic?.module_id ?? "",
    breakdown: getScoreBreakdown(best.input),
    blocked: blocked.has(best.question.topic_id),
  };
}