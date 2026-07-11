import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GenerateQuestionsFlow } from "./GenerateQuestionsFlow";

export default async function GenerateQuestionsPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id: moduleId, topicId } = await params;
  const supabase = await createClient();

  // Just for the header - the generate action re-fetches the topic when
  // it actually needs it, same small-queries trade-off as elsewhere.
  const { data: topic } = await supabase
    .from("topics")
    .select("name")
    .eq("id", topicId)
    .single();

  if (!topic) notFound();

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Breadcrumbs moduleId={moduleId} topicId={topicId} />
      <h1 className="text-2xl font-bold mb-1">Generate questions</h1>
      <p className="text-sm text-gray-600 mb-6">
        From the notes on <span className="font-medium">{topic.name}</span> and its subtopics.
        Nothing is saved until you review and accept it below.
      </p>
      <GenerateQuestionsFlow topicId={topicId} moduleId={moduleId} />
    </main>
  );
}
