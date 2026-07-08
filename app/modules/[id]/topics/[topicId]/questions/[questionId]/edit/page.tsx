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
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit question</h1>
      
      <form action={updateThisQuestion} className="space-y-5">
        
        <label className="block">
          <span className="text-sm font-medium">Question Type</span>
          <select name="question_type" defaultValue={q.question_type} className="mt-1 w-full rounded-md border px-3 py-2 bg-white">
            <option value="short_answer">Short Answer</option>
            <option value="long_answer">Long Answer</option>
            <option value="mcq">Multiple Choice (MCQ)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Question Prompt</span>
          <textarea name="prompt" required defaultValue={q.prompt} rows={3} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>

        <div className="p-4 border rounded-md bg-gray-50 space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-2">If MCQ, fill out your options (leave blank otherwise):</p>
          {["A", "B", "C", "D"].map((letter, index) => (
            <label key={letter} className="block">
              <span className="text-sm font-medium">Option {letter}</span>
              <input 
                name={`option_${letter}`} 
                defaultValue={optionsArray[index] || ""}
                className="mt-1 w-full rounded-md border px-3 py-2" 
              />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-sm font-medium">Answer</span>
          <p className="text-xs text-gray-500 mb-1">
            *If MCQ, this MUST exactly match one of the option texts above!
          </p>
          <textarea name="answer" required defaultValue={q.answer} rows={2} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Difficulty (1-5)</span>
          <input type="number" name="difficulty" min="1" max="5" defaultValue={q.difficulty} required className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>

        <SubmitButton pendingText="Saving…" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}