import { createQuestion } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id: moduleId, topicId } = await params;
  const createInThisTopic = createQuestion.bind(null, topicId);

  return (
    <main className="mx-auto max-w-xl p-6">
      <Breadcrumbs moduleId={moduleId} topicId={topicId} />
      
      <h1 className="mb-6 mt-4 text-2xl font-bold text-ink">New question</h1>
      
      <form action={createInThisTopic} className="space-y-5">
        
        <label className="block">
          <span className="text-sm font-medium text-ink">Question Type</span>
          <select name="question_type" className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
            <option value="short_answer">Short Answer</option>
            <option value="long_answer">Long Answer</option>
            <option value="mcq">Multiple Choice (MCQ)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Question Prompt</span>
          <textarea name="prompt" required rows={3} className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
        </label>

        {/* MCQ Options Block - Users can just leave these blank if not doing an MCQ */}
        <div className="space-y-3 rounded-md border border-line bg-card p-4">
          <p className="mb-2 text-sm font-medium text-ink">If MCQ, fill out your options (leave blank otherwise):</p>
          {["A", "B", "C", "D"].map((letter) => (
            <label key={letter} className="block">
              <span className="text-sm font-medium text-ink">Option {letter}</span>
              <input name={`option_${letter}`} className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-ink">Answer</span>
          <p className="mb-1 text-xs text-muted">
            *If MCQ, this MUST exactly match one of the option texts above!
          </p>
          <textarea name="answer" required rows={2} className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Difficulty (1-5)</span>
          <input type="number" name="difficulty" min="1" max="5" defaultValue="3" required className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" />
        </label>

        <SubmitButton pendingText="Creating…" className="rounded-md bg-brand px-4 py-2 text-white transition-opacity hover:opacity-80">
          Create Question
        </SubmitButton>
      </form>
    </main>
  );
}