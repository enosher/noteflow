import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuizRunner, QuizQuestion } from "./QuizRunner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id: moduleId, topicId } = await params;
  const supabase = await createClient();

  const [topicRes, questionsRes] = await Promise.all([
    supabase.from("topics").select("name").eq("id", topicId).single(),
    supabase.from("questions").select("*").eq("topic_id", topicId)
  ]);

  if (topicRes.error || !topicRes.data) notFound();

  // Cast the generic database response to Enosh's strict QuizQuestion type
  const questions = (questionsRes.data ?? []) as unknown as QuizQuestion[];

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quiz: {topicRes.data.name}</h1>
        <p className="text-gray-600">Test your knowledge on this topic.</p>
      </div>

      {questions.length === 0 ? (
        <div className="p-6 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
          There are no questions in this topic yet. Go back and add some!
        </div>
      ) : (
        <QuizRunner questions={questions} moduleId={moduleId} topicId={topicId} />
      )}
    </main>
  );
}