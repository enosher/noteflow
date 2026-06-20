import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getSignedNoteFileUrl } from "@/lib/storage";
import { deleteNote } from "./actions";
import { DeleteButton } from "@/components/DeleteButton";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default async function NoteViewPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string; noteId: string }>;
}) {
  const { id: moduleId, topicId, noteId } = await params;
  const supabase = await createClient();

  const { data: note, error } = await supabase.from("notes").select("*").eq("id", noteId).single();
  if (error || !note) notFound();

  const fileUrl = note.file_url ? await getSignedNoteFileUrl(note.file_url) : null;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/modules/${moduleId}/topics/${topicId}/notes/${noteId}/edit`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteButton action={deleteNote.bind(null, noteId)} confirmMessage="Delete this note?" />
        </div>
      </div>

      {fileUrl && (
        <p className="mb-4 text-sm">
          📎{" "}
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Attached file
          </a>
        </p>
      )}

      <div className="text-sm">
        <ReactMarkdown>{note.content ?? ""}</ReactMarkdown>
      </div>
    </main>
  );
}