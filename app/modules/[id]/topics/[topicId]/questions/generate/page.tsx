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

  const { data: topic } = await supabase
    .from("topics")
    .select("name")
    .eq("id", topicId)
    .single();

  if (!topic) notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Breadcrumbs moduleId={moduleId} topicId={topicId} />
      <h1 className="mb-1 mt-4 text-2xl font-bold text-ink">Generate questions</h1>
      <p className="mb-6 text-sm text-muted">
        From the notes on <span className="font-medium text-ink">{topic.name}</span> and its subtopics.
        Nothing is saved until you review and accept it below.
      </p>
      <GenerateQuestionsFlow topicId={topicId} moduleId={moduleId} />
    </main>
  );
}