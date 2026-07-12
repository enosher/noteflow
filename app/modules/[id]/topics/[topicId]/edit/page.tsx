// The form for editing a topic's name and description.
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateTopic } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;
  const supabase = await createClient();

  const { data: topic, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .single();

  if (error || !topic) notFound();

  const updateThisTopic = updateTopic.bind(null, topicId);

  return (
    <main className="mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Edit topic</h1>
      <form action={updateThisTopic} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required defaultValue={topic.name} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description (optional)</span>
          <textarea name="description" rows={3} defaultValue={topic.description ?? ""} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <SubmitButton pendingText="Saving…" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}