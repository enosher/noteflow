// Shows one note: its title, text, and attached file, with edit/delete buttons.
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
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold text-ink">{note.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/modules/${moduleId}/topics/${topicId}/notes/${noteId}/edit`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-surface"
          >
            Edit
          </Link>
          <DeleteButton action={deleteNote.bind(null, noteId)} confirmMessage="Delete this note?" />
        </div>
      </div>

      {fileUrl && (
        <p className="mb-4 flex items-center gap-1.5 text-sm">
          {/* SVG paperclip, not an emoji - same 1.75 stroke as the app's icon set */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-muted"
            aria-hidden="true"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
            Attached file
          </a>
        </p>
      )}

      {/* The note itself sits on ruled paper - the one place in the app
          where the page metaphor is literal. leading-7 (28px) matches the
          ruling interval so plain paragraphs sit on the lines. */}
      <div className="paper ruled-paper animate-rise-in rounded-lg border border-line/70 bg-card py-7 pl-11 pr-7">
        <div className="text-sm leading-7 text-ink [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-muted [&_code]:font-mono [&_code]:text-[13px] [&_h1]:font-display [&_h1]:text-xl [&_h2]:font-display [&_h2]:text-lg [&_h3]:font-display [&_h3]:text-base [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown>{note.content ?? ""}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}