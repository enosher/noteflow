import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { QuizRunner, QuizQuestion } from "./QuizRunner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id: moduleId, topicId } = await params;
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, prompt, answer, options, question_type, difficulty")
    .eq("topic_id", topicId);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Breadcrumbs moduleId={moduleId} topicId={topicId} />
      <h1 className="text-2xl font-bold mb-6">Quiz</h1>

      {!questions || questions.length === 0 ? (
        <p className="text-gray-600">No questions yet for this topic - add some first.</p>
      ) : (
        <QuizRunner
          // `options` comes back from Supabase typed as `Json | null`, but
          // we know from the schema it's either null or a string array.
          questions={questions as unknown as QuizQuestion[]}
          moduleId={moduleId}
          topicId={topicId}
        />
      )}
    </main>
  );
}