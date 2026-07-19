// Shows the "Modules / Topic / Note" trail of links at the top of a page.
//
// noteId is the only extra param needed to reach a note or its subtopic:
// the note-view route is always /modules/{id}/topics/{topicId}/notes/{noteId}
// even for subtopic notes (a note has either topic_id or subtopic_id, never
// both - see the notes_exactly_one_parent CHECK constraint), so there's no
// subtopicId in the URL to pass in. Looking the note up here and following
// its subtopic_id, if any, is simpler than threading a second id through
// every caller.
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function Breadcrumbs({
  moduleId,
  topicId,
  noteId,
}: {
  moduleId?: string;
  topicId?: string;
  noteId?: string;
}) {
  const supabase = await createClient();
  const crumbs: { label: string; href: string }[] = [{ label: "Modules", href: "/modules" }];

  if (moduleId) {
    const { data: mod } = await supabase.from("modules").select("code").eq("id", moduleId).single();
    crumbs.push({ label: mod?.code ?? "Module", href: `/modules/${moduleId}` });
  }

  if (topicId && moduleId) {
    const { data: topic } = await supabase.from("topics").select("name").eq("id", topicId).single();
    crumbs.push({ label: topic?.name ?? "Topic", href: `/modules/${moduleId}/topics/${topicId}` });
  }

  if (noteId && topicId && moduleId) {
    const { data: note } = await supabase
      .from("notes")
      .select("title, subtopic_id")
      .eq("id", noteId)
      .single();

    if (note?.subtopic_id) {
      const { data: subtopic } = await supabase
        .from("subtopics")
        .select("name")
        .eq("id", note.subtopic_id)
        .single();
      crumbs.push({
        label: subtopic?.name ?? "Subtopic",
        href: `/modules/${moduleId}/topics/${topicId}/subtopics/${note.subtopic_id}/edit`,
      });
    }

    crumbs.push({
      label: note?.title ?? "Note",
      href: `/modules/${moduleId}/topics/${topicId}/notes/${noteId}`,
    });
  }

  return (
    <nav className="mb-4 text-sm text-muted">
      {crumbs.map((c, i) => (
        <span key={c.href}>
          {i > 0 && <span className="mx-1.5 text-line">/</span>}
          {i === crumbs.length - 1 ? (
            <span className="text-ink">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-brand">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}