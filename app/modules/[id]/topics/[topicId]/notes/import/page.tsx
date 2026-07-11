import { createNote } from "../new/actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function ImportNotePage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;

  // Import creates a note with pre-pasted content. subtopicId is bound
  // to null, keeping the note at topic level - see the decisions log.
  const importAsNote = createNote.bind(null, topicId, null);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Import markdown</h1>
      <p className="text-gray-600 text-sm mb-6">
        {"Paste markdown from your existing notes - it'll be saved as a new note in this topic."}
      </p>
      <form action={importAsNote} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Paste markdown content</span>
          {/* Monospace so stray #s and unmatched ** are easy to spot */}
          <textarea
            name="content"
            required
            rows={14}
            placeholder="Paste your markdown here..."
            className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
          />
        </label>
        <SubmitButton pendingText="Importing…" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Import as note
        </SubmitButton>
      </form>
    </main>
  );
}