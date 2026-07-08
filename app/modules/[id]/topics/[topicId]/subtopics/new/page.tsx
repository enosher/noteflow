import { createSubtopic } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewSubtopicPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;
  const createInThisTopic = createSubtopic.bind(null, topicId);

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New subtopic</h1>
      <form action={createInThisTopic} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <SubmitButton pendingText="Creating…" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Create
        </SubmitButton>
      </form>
    </main>
  );
}