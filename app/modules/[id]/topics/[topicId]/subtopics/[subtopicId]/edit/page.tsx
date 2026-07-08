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
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit subtopic</h1>
      <form action={updateThisSubtopic} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required defaultValue={subtopic.name} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <SubmitButton pendingText="Saving…" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}