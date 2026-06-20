import { createNote } from "./actions";

export default async function NewNotePage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;

  // createNote(topicId, subtopicId, formData) — subtopicId is null because
  // this form creates a topic-level note.
  const createThisNote = createNote.bind(null, topicId, null);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New note</h1>
      <form action={createThisNote} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Content (markdown)</span>
          <textarea name="content" rows={10} className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Attach a file (optional)</span>
          <input type="file" name="file" className="mt-1 block text-sm" />
        </label>
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Save note
        </button>
      </form>
    </main>
  );
}