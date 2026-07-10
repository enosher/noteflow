"use server";

// Concept graph actions. Cycle detection lives in lib/prereq.ts (pure,
// tested); these just fetch the module's existing edges to check against
// and move the result to/from Supabase.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTopicAccuracy } from "@/lib/weak-topics";
import { wouldCreateCycle, blockedTopics, type PrereqEdge } from "@/lib/prereq";
import { friendlyMessage } from "@/lib/errors";

export type GraphTopic = {
  id: string;
  name: string;
  accuracy: number | null;
  attempts: number;
};

export type ModuleGraph = {
  topics: GraphTopic[];
  edges: PrereqEdge[];
  blocked: string[]; // topic ids currently gated by a weak prerequisite
};

export async function getModuleGraph(moduleId: string): Promise<ModuleGraph> {
  const supabase = await createClient();

  const { data: topics, error: topicsErr } = await supabase
    .from("topics")
    .select("id, name")
    .eq("module_id", moduleId)
    .order("order_index");
  if (topicsErr) throw new Error(friendlyMessage(topicsErr));
  if (!topics || topics.length === 0) return { topics: [], edges: [], blocked: [] };

  const topicIds = topics.map((t) => t.id);
  const { data: edges, error: edgesErr } = await supabase
    .from("topic_prerequisites")
    .select("topic_id, prerequisite_topic_id")
    .in("topic_id", topicIds);
  if (edgesErr) throw new Error(friendlyMessage(edgesErr));

  // Same per-user accuracy the dashboard and recommender already use,
  // narrowed here to this module's topics.
  const accuracyStats = await getTopicAccuracy(supabase);
  const statsByTopic = new Map(accuracyStats.map((s) => [s.topic_id, s]));

  const graphTopics: GraphTopic[] = topics.map((t) => {
    const stat = statsByTopic.get(t.id);
    return {
      id: t.id,
      name: t.name,
      accuracy: stat?.accuracy ?? null,
      attempts: stat?.attempts ?? 0,
    };
  });

  const blocked = blockedTopics(
    edges ?? [],
    graphTopics.map((t) => ({ topic_id: t.id, accuracy: t.accuracy ?? 0, attempts: t.attempts }))
  );

  return { topics: graphTopics, edges: edges ?? [], blocked: [...blocked] };
}

export async function addPrerequisite(
  moduleId: string,
  topicId: string,
  prerequisiteTopicId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: moduleTopics, error: topicsErr } = await supabase
    .from("topics")
    .select("id")
    .eq("module_id", moduleId);
  if (topicsErr) return { error: friendlyMessage(topicsErr) };

  const { data: existingEdges, error: fetchErr } = await supabase
    .from("topic_prerequisites")
    .select("topic_id, prerequisite_topic_id")
    .in("topic_id", (moduleTopics ?? []).map((t) => t.id));
  if (fetchErr) return { error: friendlyMessage(fetchErr) };

  // App-level guard: the DB has no way to check for cycles at insert time.
  if (wouldCreateCycle(existingEdges ?? [], topicId, prerequisiteTopicId)) {
    return { error: "That would create a cycle -- a topic can't depend on itself, even indirectly." };
  }

  const { error } = await supabase
    .from("topic_prerequisites")
    .insert({ topic_id: topicId, prerequisite_topic_id: prerequisiteTopicId });
  if (error) return { error: friendlyMessage(error) };

  revalidatePath(`/modules/${moduleId}/graph`);
  revalidatePath("/dashboard/recommendation");
  return {};
}

export async function removePrerequisite(
  moduleId: string,
  topicId: string,
  prerequisiteTopicId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("topic_prerequisites")
    .delete()
    .eq("topic_id", topicId)
    .eq("prerequisite_topic_id", prerequisiteTopicId);
  if (error) return { error: friendlyMessage(error) };

  revalidatePath(`/modules/${moduleId}/graph`);
  revalidatePath("/dashboard/recommendation");
  return {};
}
