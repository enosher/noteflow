"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { friendlyMessage } from "@/lib/errors";

export async function updateSubtopic(subtopicId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required.");

  // Embedding topics(module_id) in one query rather than two sequential
  // lookups (subtopic -> topic, then topic -> module) saves a round trip.
  const { data: subtopic, error: fetchError } = await supabase
    .from("subtopics")
    .select("topic_id, topics(module_id)")
    .eq("id", subtopicId)
    .single();

  if (fetchError || !subtopic) throw new Error("Subtopic not found.");

  const { error } = await supabase.from("subtopics").update({ name }).eq("id", subtopicId);
  if (error) throw new Error(friendlyMessage(error));

  // Why the cast: a subtopic has exactly one parent topic, but Supabase's generated
  // types treat every embedded relation as potentially an array or null,
  // since Postgrest can't tell from the schema alone that this relation
  // is one-to-one. We know it's safe here; the cast documents that
  // assumption rather than silently suppressing a real type error.
  const moduleId = (subtopic.topics as unknown as { module_id: string }).module_id;

  revalidatePath(`/modules/${moduleId}/topics/${subtopic.topic_id}`);
  redirect(`/modules/${moduleId}/topics/${subtopic.topic_id}`);
}

export async function deleteSubtopic(subtopicId: string) {
  const supabase = await createClient();

  // Fetched before the delete, not after. Once the row is gone there's
  // nothing left to join through to find topic_id/module_id, and we need
  // both for the redirect.
  const { data: subtopic } = await supabase
    .from("subtopics")
    .select("topic_id, topics(module_id)")
    .eq("id", subtopicId)
    .single();

  const { error } = await supabase.from("subtopics").delete().eq("id", subtopicId);
  if (error) throw new Error(friendlyMessage(error));

  // Cascade note: deleting a subtopic cascades to any notes/questions
  // attached to it (on delete cascade, m2_schema.sql).
  if (subtopic) {
    const moduleId = (subtopic.topics as unknown as { module_id: string }).module_id;
    revalidatePath(`/modules/${moduleId}/topics/${subtopic.topic_id}`);
    redirect(`/modules/${moduleId}/topics/${subtopic.topic_id}`);
  }
  redirect("/modules");
}