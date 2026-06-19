"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { uploadNoteFile } from "@/lib/storage";

export async function createNote(
  topicId: string,
  subtopicId: string | null,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string) || null;
  const file = formData.get("file") as File | null;

  if (!title) throw new Error("Title is required.");

  let fileUrl: string | null = null;
  if (file && file.size > 0) {
    fileUrl = await uploadNoteFile(file, user.id);
  }

  // Exactly one topic_id / subtopic_id -- matches the DB check constraint
  // (notes_exactly_one_parent). This form only creates topic-level
  // notes (subtopicId is bound to null by the page), but the insert works
  // if a subtopic-level "new note" link is added later.
  const { error } = await supabase.from("notes").insert({
    topic_id: subtopicId ? null : topicId,
    subtopic_id: subtopicId,
    title,
    content,
    file_url: fileUrl,
  });

  if (error) throw new Error(error.message);

  const { data: topic } = await supabase.from("topics").select("module_id").eq("id", topicId).single();

  revalidatePath(`/modules/${topic?.module_id}/topics/${topicId}`);
  redirect(`/modules/${topic?.module_id}/topics/${topicId}`);
}