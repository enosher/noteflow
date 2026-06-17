import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateTopic } from "./actions";

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
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit topic</h1>
      <form action={updateThisTopic} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required defaultValue={topic.name} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description (optional)</span>
          <textarea name="description" rows={3} defaultValue={topic.description ?? ""} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Save changes
        </button>
      </form>
    </main>
  );
}