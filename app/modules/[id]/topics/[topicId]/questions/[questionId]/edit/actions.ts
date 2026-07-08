"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyMessage } from "@/lib/errors";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export async function updateQuestion(questionId: string, formData: FormData) {
  const supabase = await createClient();

  const prompt = (formData.get("prompt") as string)?.trim();
  const answer = (formData.get("answer") as string)?.trim();
  const questionType = formData.get("question_type") as "mcq" | "short_answer" | "long_answer";
  const difficulty = Number(formData.get("difficulty"));

  if (!prompt || !answer) throw new Error("Prompt and answer are required.");

  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new Error("Difficulty must be an integer between 1 and 5.");
  }

  let options: string[] | null = null;
  if (questionType === "mcq") {
    options = OPTION_LETTERS
      .map((letter) => (formData.get(`option_${letter}`) as string)?.trim())
      .filter((opt): opt is string => !!opt);

    if (options.length < 2) throw new Error("MCQ questions need at least 2 options.");
    if (!options.includes(answer)) {
      throw new Error("The answer must match one of the options exactly.");
    }
  }

  const { error } = await supabase
    .from("questions")
    .update({
      prompt,
      answer,
      options,
      question_type: questionType,
      difficulty,
    })
    .eq("id", questionId);

  if (error) throw new Error(friendlyMessage(error));

  const { data: q } = await supabase
    .from("questions")
    .select("topic_id, topics(module_id)")
    .eq("id", questionId)
    .single();

  if (q && q.topics) {
    const moduleId = (q.topics as unknown as { module_id: string }).module_id;
    revalidatePath(`/modules/${moduleId}/topics/${q.topic_id}`);
    redirect(`/modules/${moduleId}/topics/${q.topic_id}`);
  }
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient();
  
  const { data: q } = await supabase.from("questions").select("topic_id, topics(module_id)").eq("id", questionId).single();

  const { error } = await supabase.from("questions").delete().eq("id", questionId);

  if (q && q.topics && !error) {
    const moduleId = (q.topics as unknown as { module_id: string }).module_id;
    revalidatePath(`/modules/${moduleId}/topics/${q.topic_id}`);
  }
}