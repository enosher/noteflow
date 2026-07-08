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
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit note</h1>
      <form action={updateThisNote} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input name="title" required defaultValue={note.title} className="mt-1 w-full rounded-md border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Content (markdown)</span>
          <textarea name="content" rows={10} defaultValue={note.content ?? ""} className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">
            {note.file_url ? "Replace attached file (optional)" : "Attach a file (optional)"}
          </span>
          <input type="file" name="file" className="mt-1 block text-sm" />
        </label>
        <SubmitButton pendingText="Saving…" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}