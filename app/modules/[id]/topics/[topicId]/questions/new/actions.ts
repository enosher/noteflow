"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { friendlyMessage } from "@/lib/errors";

// Matches the DB check constraint (questions_mcq_has_options): MCQ rows
// must have a jsonb array of options. We cap at 4 letters here as
// a UI convenience for the form, but the DB itself doesn't enforce a max.
const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export async function createQuestion(topicId: string, formData: FormData) {
  const supabase = await createClient();

  const prompt = (formData.get("prompt") as string)?.trim();
  const answer = (formData.get("answer") as string)?.trim();
  const questionType = formData.get("question_type") as "mcq" | "short_answer" | "long_answer";
  const difficulty = Number(formData.get("difficulty"));

  if (!prompt || !answer) throw new Error("Prompt and answer are required.");

  // Difficulty has a DB check (between 1 and 5) but we validate here too so
  // the error message is readable instead of a raw Postgres constraint error.
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new Error("Difficulty must be an integer between 1 and 5.");
  }

  let options: string[] | null = null;
  if (questionType === "mcq") {
    // Pull whichever option_A to option_D fields were filled in, drop blanks.
    // This lets the form always render 4 inputs without forcing all 4 to be used.
    options = OPTION_LETTERS
      .map((letter) => (formData.get(`option_${letter}`) as string)?.trim())
      .filter((opt): opt is string => !!opt);

    if (options.length < 2) throw new Error("MCQ questions need at least 2 options.");

    // For MCQ, answer must be one of the literal option strings, since
    // submitAnswer() does a straight string comparison. Catching a mismatch
    // here beats debugging "every MCQ marked wrong" mid-quiz.
    if (!options.includes(answer)) {
      throw new Error("The answer must match one of the options exactly.");
    }
  }

  // subtopic_id is left null deliberately. this form only creates
  // questions at the topic level. Narrowing a question to a subtopic (if
  // ever needed) would be a separate edit action, not part of creation.
  const { error } = await supabase.from("questions").insert({
    topic_id: topicId,
    subtopic_id: null,
    prompt,
    answer,
    options,
    question_type: questionType,
    difficulty,
  });

  if (error) throw new Error(friendlyMessage(error));

  // Need module_id to build the redirect path - questions don't carry it
  // directly, so it's looked up via the parent topic.
  const { data: topic } = await supabase
    .from("topics")
    .select("module_id")
    .eq("id", topicId)
    .single();

  revalidatePath(`/modules/${topic?.module_id}/topics/${topicId}`);
  redirect(`/modules/${topic?.module_id}/topics/${topicId}`);
}