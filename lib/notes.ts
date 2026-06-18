import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Resolve a note's topic_id and module_id, whether it's attached directly
 * to a topic or via a subtopic.
 */
export async function getNoteLocation(
  supabase: SupabaseClient<Database>,
  topicId: string | null,
  subtopicId: string | null
): Promise<{ topicId: string; moduleId: string }> {
  let resolvedTopicId = topicId;

  if (!resolvedTopicId && subtopicId) {
    const { data } = await supabase.from("subtopics").select("topic_id").eq("id", subtopicId).single();
    resolvedTopicId = data?.topic_id ?? null;
  }

  if (!resolvedTopicId) throw new Error("Note has no topic or subtopic.");

  const { data: topic } = await supabase
    .from("topics")
    .select("module_id")
    .eq("id", resolvedTopicId)
    .single();

  if (!topic) throw new Error("Topic not found.");

  return { topicId: resolvedTopicId, moduleId: topic.module_id };
}