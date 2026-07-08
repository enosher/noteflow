"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { friendlyMessage } from "@/lib/errors";

export async function updateTopic(topicId: string, formData: FormData) {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) throw new Error("Name is required.");

  // The route only gives us topicId, but the redirect target needs
  // module_id too (in /modules/[id]/topics/[topicId]).
  // Fetching first means we still get a clean "not found" if RLS
  // hides this topic, rather than a confusing redirect to undefined.
  const { data: topic, error: fetchError } = await supabase
    .from("topics")
    .select("module_id")
    .eq("id", topicId)
    .single();

  if (fetchError || !topic) throw new Error("Topic not found.");

  const { error } = await supabase
    .from("topics")
    .update({ name, description })
    .eq("id", topicId);

  if (error) throw new Error(friendlyMessage(error));

  // Both paths need revalidating: the module detail page lists topics
  // inline, and the topic's own detail page shows the updated name/desc.
  revalidatePath(`/modules/${topic.module_id}`);
  revalidatePath(`/modules/${topic.module_id}/topics/${topicId}`);
  redirect(`/modules/${topic.module_id}/topics/${topicId}`);
}

export async function deleteTopic(topicId: string) {
  const supabase = await createClient();

  // Fetch module_id BEFORE deleting — once the row is gone, there's no
  // way to look up where it used to live, and we still want to redirect
  // back to the right module rather than a generic /modules list.
  const { data: topic } = await supabase
    .from("topics")
    .select("module_id")
    .eq("id", topicId)
    .single();

  const { error } = await supabase.from("topics").delete().eq("id", topicId);
  if (error) throw new Error(friendlyMessage(error));

  if (topic) {
    revalidatePath(`/modules/${topic.module_id}`);
    redirect(`/modules/${topic.module_id}`);
  }
  // Fallback: if the topic was already gone or RLS hid it, there's
  // nowhere sensible to redirect except the top-level list.
  redirect("/modules");
}