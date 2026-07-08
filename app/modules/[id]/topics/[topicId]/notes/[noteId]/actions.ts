"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { uploadNoteFile } from "@/lib/storage";
import { getNoteLocation } from "@/lib/notes";
import { friendlyMessage } from "@/lib/errors";

export async function updateNote(noteId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string) || null;
  const file = formData.get("file") as File | null;

  if (!title) throw new Error("Title is required.");

  const { data: existing, error: fetchError } = await supabase
    .from("notes")
    .select("topic_id, subtopic_id")
    .eq("id", noteId)
    .single();

  if (fetchError || !existing) throw new Error("Note not found.");

  // file_url is only included in the update object if a new file was
  // actually uploaded. omitting the key (rather than setting it to null
  // or the old value) means an edit with no new file leaves the current
  // attachment untouched.
  const update: { title: string; content: string | null; file_url?: string } = { title, content };
  if (file && file.size > 0) {
    update.file_url = await uploadNoteFile(file, user.id);
  }

  const { error } = await supabase.from("notes").update(update).eq("id", noteId);
  if (error) throw new Error(friendlyMessage(error));

  const { topicId, moduleId } = await getNoteLocation(supabase, existing.topic_id, existing.subtopic_id);

  revalidatePath(`/modules/${moduleId}/topics/${topicId}/notes/${noteId}`);
  redirect(`/modules/${moduleId}/topics/${topicId}/notes/${noteId}`);
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient();

  // Look up location before deleting; once the row is gone there's
  // nothing left to resolve topic_id/subtopic_id from for the redirect.
  const { data: existing } = await supabase.from("notes").select("topic_id, subtopic_id").eq("id", noteId).single();
  if (!existing) redirect("/modules");

  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw new Error(friendlyMessage(error));

  const { topicId, moduleId } = await getNoteLocation(supabase, existing.topic_id, existing.subtopic_id);

  revalidatePath(`/modules/${moduleId}/topics/${topicId}`);
  redirect(`/modules/${moduleId}/topics/${topicId}`);
}