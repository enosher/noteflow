// The form for editing a note's title, text, and attached file.
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateNote } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string; topicId: string; noteId: string }>;
}) {
  const { noteId } = await params;
  const supabase = await createClient();

  const { data: note, error } = await supabase.from("notes").select("*").eq("id", noteId).single();
  if (error || !note) notFound();

  const updateThisNote = updateNote.bind(null, noteId);

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Edit note</h1>
      <form action={updateThisNote} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required defaultValue={note.title} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Content (markdown)</span>
          <textarea name="content" rows={10} defaultValue={note.content ?? ""} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30 font-mono text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            {note.file_url ? "Replace attached file (optional)" : "Attach a file (optional)"}
          </span>
          <input type="file" name="file" className="mt-1 block text-sm" />
        </label>
        <SubmitButton pendingText="Saving…" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}