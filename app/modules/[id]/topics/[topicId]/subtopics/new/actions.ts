"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { friendlyMessage } from "@/lib/errors";

export async function createSubtopic(topicId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required.");

  // subtopics has no module_id column, only topic_id, so it's derived by
  // following topic -> module. Needed purely for the redirect target,
  // since the URL (/modules/[id]/topics/[topicId]) embeds it.
  const { data: topic } = await supabase
    .from("topics")
    .select("module_id")
    .eq("id", topicId)
    .single();

  const { error } = await supabase.from("subtopics").insert({
    topic_id: topicId,
    name,
    // Hardcoded to 0 rather than "last position + 1": drag-to-reorder
    // isn't on the M2 must-ship list, so new subtopics landing at the
    // front is an accepted limitation, not a bug.
    order_index: 0,
  });

  if (error) throw new Error(friendlyMessage(error));

  // No manual ownership check before the insert: RLS policy
  // subtopics_insert_own already joins topic -> module -> user_id, so a
  // foreign topicId fails at the DB level and the error above catches it.
  revalidatePath(`/modules/${topic?.module_id}/topics/${topicId}`);
  redirect(`/modules/${topic?.module_id}/topics/${topicId}`);
}