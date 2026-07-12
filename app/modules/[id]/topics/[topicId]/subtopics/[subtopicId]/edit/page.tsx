// The form for editing a subtopic's name.
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateSubtopic } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function EditSubtopicPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string; subtopicId: string }>;
}) {
  const { subtopicId } = await params;
  const supabase = await createClient();

  const { data: subtopic, error } = await supabase
    .from("subtopics")
    .select("*")
    .eq("id", subtopicId)
    .single();

  if (error || !subtopic) notFound();

  const updateThisSubtopic = updateSubtopic.bind(null, subtopicId);

  return (
    <main className="mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Edit subtopic</h1>
      <form action={updateThisSubtopic} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required defaultValue={subtopic.name} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <SubmitButton pendingText="Saving…" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}