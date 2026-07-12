import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateQuestion } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string; questionId: string }>;
}) {
  const { questionId } = await params;
  const supabase = await createClient();

  const { data: q, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (error || !q) notFound();

  const updateThisQuestion = updateQuestion.bind(null, questionId);

  // Safely extract the existing options array if it exists
  const optionsArray = (Array.isArray(q.options) ? q.options : []) as string[];

  return (
    <main className="mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Edit question</h1>
      
      <form action={updateThisQuestion} className="space-y-5">
        
        <label className="block">
          <span className="text-sm font-medium">Question Type</span>
          <select name="question_type" defaultValue={q.question_type} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30 bg-card">
            <option value="short_answer">Short Answer</option>
            <option value="long_answer">Long Answer</option>
            <option value="mcq">Multiple Choice (MCQ)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Question Prompt</span>
          <textarea name="prompt" required defaultValue={q.prompt} rows={3} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>

        <div className="p-4 border rounded-md bg-surface space-y-3">
          <p className="text-sm font-medium text-ink mb-2">If MCQ, fill out your options (leave blank otherwise):</p>
          {["A", "B", "C", "D"].map((letter, index) => (
            <label key={letter} className="block">
              <span className="text-sm font-medium">Option {letter}</span>
              <input 
                name={`option_${letter}`} 
                defaultValue={optionsArray[index] || ""}
                className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" 
              />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium">Answer</span>
          <p className="text-xs text-muted mb-1">
            *If MCQ, this MUST exactly match one of the option texts above!
          </p>
          <textarea name="answer" required defaultValue={q.answer} rows={2} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Difficulty (1-5)</span>
          <input type="number" name="difficulty" min="1" max="5" defaultValue={q.difficulty} required className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>

        <SubmitButton pendingText="Saving…" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}