"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createSubtopic(topicId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required.");

  // Why we look up module_id here even though it's not part of the insert:
  // subtopics doesn't have a module_id column — it only knows its parent
  // topic_id, and module_id is derived by following topic -> module (same
  // normalization as the rest of the schema; see m2_schema.sql). We need
  // module_id purely for the redirect target, since the URL structure
  // embeds it (/modules/[id]/topics/[topicId]). If we skipped this lookup
  // we'd have no way to build that path after the insert.
  const { data: topic } = await supabase
    .from("topics")
    .select("module_id")
    .eq("id", topicId)
    .single();

  const { error } = await supabase.from("subtopics").insert({
    topic_id: topicId,
    name,
    // Why order_index is hardcoded to 0 rather than "last position + 1":
    // manual drag-to-reorder isn't on the M2 must-ship list, so every
    // subtopic landing at the front of the list is a known, acceptable
    // limitation rather than a bug — will revisit if reordering UI gets built.
    order_index: 0,
  });

  if (error) throw new Error(error.message);

  // No explicit "does this topic belong to this user" check before the
  // insert: subtopics_insert_own's RLS policy (m2_schema.sql) already joins
  // topic -> module -> user_id. If topicId belonged to someone else, the
  // insert itself would fail at the database level — we don't need to
  // duplicate that logic in application code, just handle the resulting
  // error, which the `if (error)` above does.
  revalidatePath(`/modules/${topic?.module_id}/topics/${topicId}`);
  redirect(`/modules/${topic?.module_id}/topics/${topicId}`);
}