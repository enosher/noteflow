"use server";

// Review-queue actions. Logic is in lib/sm2.ts where it's testable without a database. 
// These just move state between Supabase and the pure core.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  INITIAL_STATE,
  nextReviewState,
  qualityFromCorrect,
  nextDueDate,
  type ReviewState,
} from "@/lib/sm2";
import { friendlyMessage } from "@/lib/errors";

export type DueReview = {
  question_id: string;
  prompt: string;
  answer: string;
  question_type: string;
  options: string[] | null;
  topic_name: string;
  due_at: string;
};

export async function getDueReviews(): Promise<DueReview[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("review_schedule")
    .select("question_id, due_at, questions(prompt, answer, question_type, options, topics(name))")
    .eq("user_id", user.id)
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(20);
  if (error) throw new Error(friendlyMessage(error));

  return (data ?? []).map((row) => {
    const q = row.questions as unknown as {
      prompt: string;
      answer: string;
      question_type: string;
      options: string[] | null;
      topics: { name: string };
    };
    return {
      question_id: row.question_id,
      prompt: q.prompt,
      answer: q.answer,
      question_type: q.question_type,
      options: q.options,
      topic_name: q.topics.name,
      due_at: row.due_at,
    };
  });
}

// Called after every graded answer - quiz flow and the review queue.
// The first time we see a (user, question) pair, the schedule starts from INITIAL_STATE.
export async function updateReviewSchedule(
  questionId: string,
  isCorrect: boolean
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: existing, error: selErr } = await supabase
    .from("review_schedule")
    .select("ease_factor, interval_days, repetitions")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();
  if (selErr) throw new Error(friendlyMessage(selErr));

  const prev: ReviewState = existing
    ? {
        easeFactor: existing.ease_factor,
        intervalDays: existing.interval_days,
        repetitions: existing.repetitions,
      }
    : INITIAL_STATE;

  const next = nextReviewState(prev, qualityFromCorrect(isCorrect));
  const now = new Date();

  const { error } = await supabase.from("review_schedule").upsert(
    {
      user_id: user.id,
      question_id: questionId,
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      due_at: nextDueDate(now, next.intervalDays).toISOString(),
      last_reviewed_at: now.toISOString(),
    },
    { onConflict: "user_id,question_id" }
  );
  if (error) throw new Error(friendlyMessage(error));

  revalidatePath("/review");
  revalidatePath("/dashboard");
}

// Lightweight count for the nav badge
export async function getDueReviewCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("review_schedule")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("due_at", new Date().toISOString());
  if (error) throw new Error(friendlyMessage(error));

  return count ?? 0;
}