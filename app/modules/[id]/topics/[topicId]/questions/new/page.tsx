import { createQuestion } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;
  const createInThisTopic = createQuestion.bind(null, topicId);

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New question</h1>
      
      <form action={createInThisTopic} className="space-y-5">
        
        <label className="block">
          <span className="text-sm font-medium">Question Type</span>
          <select name="question_type" className="mt-1 w-full rounded-md border px-3 py-2 bg-white">
            <option value="short_answer">Short Answer</option>
            <option value="long_answer">Long Answer</option>
            <option value="mcq">Multiple Choice (MCQ)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Question Prompt</span>
          <textarea name="prompt" required rows={3} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>

        {/* MCQ Options Block - Users can just leave these blank if not doing an MCQ */}
        <div className="p-4 border rounded-md bg-gray-50 space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-2">If MCQ, fill out your options (leave blank otherwise):</p>
          {["A", "B", "C", "D"].map((letter) => (
            <label key={letter} className="block">
              <span className="text-sm font-medium">Option {letter}</span>
              <input name={`option_${letter}`} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium">Answer</span>
          <p className="text-xs text-gray-500 mb-1">
            *If MCQ, this MUST exactly match one of the option texts above!
          </p>
          <textarea name="answer" required rows={2} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Difficulty (1-5)</span>
          <input type="number" name="difficulty" min="1" max="5" defaultValue="3" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>

        <SubmitButton pendingText="Creating…" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Create Question
        </SubmitButton>
      </form>
    </main>
  );
}