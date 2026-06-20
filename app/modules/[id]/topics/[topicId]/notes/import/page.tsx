import { createNote } from "../new/actions";

export default async function ImportNotePage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;

  // Import creates a note with pre-pasted content
  // Binding subtopicId to null here (instead of topicId) keeps the note at topic level. See decisions log
  const importAsNote = createNote.bind(null, topicId, null);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Import markdown</h1>
      <p className="text-gray-600 text-sm mb-6">
        {"Paste markdown from your existing notes -- it'll be saved as a new note in this topic."}
      </p>
      <form action={importAsNote} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Paste markdown content</span>
          {/* mono font here cuz easier to look for formatting mistakes (like stray #, unmatched ** etc) in a font with fixed width */}
          <textarea
            name="content"
            required
            rows={14}
            placeholder="Paste your markdown here..."
            className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Import as note
        </button>
      </form>
    </main>
  );
}