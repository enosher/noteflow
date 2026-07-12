import { createNote } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewNotePage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;

  // createNote(topicId, subtopicId, formData) - subtopicId is null since
  // this form creates a topic-level note.
  const createThisNote = createNote.bind(null, topicId, null);

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">New note</h1>
      <form action={createThisNote} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Content (markdown)</span>
          <textarea name="content" rows={10} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30 font-mono text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Attach a file (optional)</span>
          <input type="file" name="file" className="mt-1 block text-sm" />
        </label>
        <SubmitButton pendingText="Saving...">Save note</SubmitButton>
      </form>
    </main>
  );
}