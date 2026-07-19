import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { QuizRunner, QuizQuestion } from "./QuizRunner";
import EmptyState from "@/components/empty-state";
import { shuffle } from "@/lib/shuffle";

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
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <Breadcrumbs moduleId={moduleId} topicId={topicId} />
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">Quiz</h1>

      {!questions || questions.length === 0 ? (
        <EmptyState
          message="No questions yet for this topic. Add some to test your mastery."
          actionLabel="Add a question"
          actionHref={`/modules/${moduleId}/topics/${topicId}/questions/new`}
        />
      ) : (
        <QuizRunner
          // `options` comes back from Supabase typed as `Json | null`, but
          // we know from the schema it's either null or a string array.
          // Shuffled fresh on every page load (every attempt), question
          // order and MCQ option order both - grading compares by string
          // value everywhere downstream, not index, so this is safe.
          questions={shuffle(questions as unknown as QuizQuestion[]).map((q) => ({
            ...q,
            options: q.options ? shuffle(q.options) : q.options,
          }))}
          moduleId={moduleId}
          topicId={topicId}
        />
      )}
    </main>
  );
}