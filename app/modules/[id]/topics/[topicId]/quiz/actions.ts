"use server";

import { createClient } from "@/lib/supabase/server";
import { updateReviewSchedule } from "@/app/review/actions";
import { friendlyMessage } from "@/lib/errors";

export async function submitAnswer(
  questionId: string,
  userAnswer: string,
  timeTakenMs: number
): Promise<{ isCorrect: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("answer, question_type")
    .eq("id", questionId)
    .single();

  if (questionError || !question) throw new Error("Question not found.");

  // MCQ/short-answer: trimmed, case-insensitive match, good enough for M2.
  // Long-answer can't be graded by string match, so it's always marked
  // correct (attempt still logs for time tracking) - proper grading is M3.
  let isCorrect: boolean;
  if (question.question_type === "long_answer") {
    isCorrect = true;
  } else {
    isCorrect = userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
  }

  // Recording the attempt is the same DB round-trip as checking correctness,
  // so this one action covers both "submit answer" and "record attempt",
  // no reason to split them into two separate calls.
  const { error: insertError } = await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    question_id: questionId,
    user_answer: userAnswer,
    is_correct: isCorrect,
    time_taken_ms: timeTakenMs,
  });

  if (insertError) throw new Error(friendlyMessage(insertError));

  // Every graded answer feeds the SM-2 schedule too - wrong answers get
  // reviewed again tomorrow, right answers push the interval out.
  await updateReviewSchedule(questionId, isCorrect);

  return { isCorrect };
}