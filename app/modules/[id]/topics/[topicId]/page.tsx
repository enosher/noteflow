import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { deleteSubtopic } from "./subtopics/[subtopicId]/edit/actions";
import { DeleteButton } from "@/components/DeleteButton";
import EmptyState from "@/components/empty-state";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id: moduleId, topicId } = await params;
  const supabase = await createClient();

  const [topicRes, subtopicsRes, notesRes, questionsRes] = await Promise.all([
    supabase.from("topics").select("*").eq("id", topicId).single(),
    supabase.from("subtopics").select("id, name").eq("topic_id", topicId).order("order_index"),
    supabase.from("notes").select("id, title").eq("topic_id", topicId),
    supabase.from("questions").select("id, prompt, difficulty").eq("topic_id", topicId),
  ]);

  if (topicRes.error || !topicRes.data) notFound();

  const topic = topicRes.data;
  const subtopics = subtopicsRes.data ?? [];
  const notes = notesRes.data ?? [];
  const questions = questionsRes.data ?? [];

  // Subtopic-level notes, grouped by subtopic - fetched separately since
  // it depends on the subtopic ids above.
  const subtopicIds = subtopics.map((s) => s.id);
  const subtopicNotesRes = subtopicIds.length
    ? await supabase.from("notes").select("id, title, subtopic_id").in("subtopic_id", subtopicIds)
    : { data: [] };
  const subtopicNotes = subtopicNotesRes.data ?? [];
  const notesBySubtopic = new Map<string, { id: string; title: string }[]>();
  for (const n of subtopicNotes) {
    if (!n.subtopic_id) continue;
    const list = notesBySubtopic.get(n.subtopic_id) ?? [];
    list.push({ id: n.id, title: n.title });
    notesBySubtopic.set(n.subtopic_id, list);
  }

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <Breadcrumbs moduleId={moduleId} topicId={topicId} />

      <h1 className="font-display text-2xl font-semibold text-ink mb-2">{topic.name}</h1>
      {topic.description && <p className="text-ink mb-6">{topic.description}</p>}

      {/* Subtopics */}
      <section className="animate-rise-in mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base italic text-ink">Subtopics</h2>
          <Link
            href={`/modules/${moduleId}/topics/${topicId}/subtopics/new`}
            className="text-sm text-brand hover:underline"
          >
            + New subtopic
          </Link>
        </div>
        {subtopics.length === 0 ? (
          <EmptyState
            message="Subtopics help you break down complex material. Add one to keep your notes organized."
            actionLabel="Add subtopic"
            actionHref={`/modules/${moduleId}/topics/${topicId}/subtopics/new`}
          />
        ) : (
          <ul className="space-y-2">
            {subtopics.map((s) => {
              const sNotes = notesBySubtopic.get(s.id) ?? [];
              return (
                <li key={s.id} className="rounded-md border border-line/70 bg-card p-3 text-sm transition-colors hover:bg-surface">
                  <div className="flex items-center justify-between">
                    <Link href={`/modules/${moduleId}/topics/${topicId}/subtopics/${s.id}/edit`} className="flex-1 flex items-center gap-3 group">
                      <span className="group-hover:text-brand group-hover:underline">{s.name}</span>
                      <span className="text-muted group-hover:text-brand">›</span>
                    </Link>
                    <div className="flex gap-2 ml-4">
                      <DeleteButton
                        action={deleteSubtopic.bind(null, s.id)}
                        confirmMessage="Delete this subtopic?"
                      />
                    </div>
                  </div>

                  {/* This subtopic's own notes - separate from the topic-level
                      Notes section below (notes attach to exactly one of
                      topic or subtopic, per the DB check constraint). */}
                  <div className="mt-2 pl-1">
                    {sNotes.length > 0 && (
                      <ul className="space-y-1 mb-1.5">
                        {sNotes.map((n) => (
                          <li key={n.id}>
                            <Link
                              href={`/modules/${moduleId}/topics/${topicId}/notes/${n.id}`}
                              className="text-xs text-ink hover:text-brand hover:underline"
                            >
                              {n.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href={`/modules/${moduleId}/topics/${topicId}/subtopics/${s.id}/notes/new`}
                      className="text-xs text-brand hover:underline"
                    >
                      + New note
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Notes */}
      <section className="animate-rise-in mb-8" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base italic text-ink">Notes</h2>
          <Link
            href={`/modules/${moduleId}/topics/${topicId}/notes/new`}
            className="text-sm text-brand hover:underline"
          >
            + New note
          </Link>
        </div>
        {notes.length === 0 ? (
          <EmptyState
            message="Notes are the foundation of your learning. Add your material here so NoteFlow can generate questions for you."
            actionLabel="Add note"
            actionHref={`/modules/${moduleId}/topics/${topicId}/notes/new`}
          />
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-md border border-line/70 bg-card p-3 text-sm transition-colors hover:bg-surface">
                <Link href={`/modules/${moduleId}/topics/${topicId}/notes/${n.id}`} className="flex items-center gap-3 group">
                  <span className="flex-1 group-hover:text-brand group-hover:underline">{n.title}</span>
                  <span className="text-muted group-hover:text-brand">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Questions */}
      <section className="animate-rise-in" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base italic text-ink">Questions</h2>
          <div className="flex items-center gap-4">
            {/* Drafts from this topic's notes via Gemini; nothing saves
                until the review screen - see questions/generate. */}
            <Link
              href={`/modules/${moduleId}/topics/${topicId}/questions/generate`}
              className="text-sm text-brand hover:underline"
            >
              Generate questions
            </Link>
            <Link
              href={`/modules/${moduleId}/topics/${topicId}/questions/new`}
              className="text-sm text-brand hover:underline"
            >
              + New question
            </Link>
          </div>
        </div>
        {questions.length === 0 ? (
          <EmptyState
            message="Questions test your mastery. Write your own or let NoteFlow generate them from your notes."
            actionLabel="Add question"
            actionHref={`/modules/${moduleId}/topics/${topicId}/questions/new`}
          />
        ) : (
          <>
            <ul className="space-y-2 mb-3">
              {questions.map((q) => (
                <li key={q.id} className="rounded-md border border-line/70 bg-card p-3 text-sm flex items-center justify-between transition-colors hover:bg-surface">
                  <Link href={`/modules/${moduleId}/topics/${topicId}/questions/${q.id}/edit`} className="flex-1 flex items-center gap-3 group">
                    <span className="flex-1 group-hover:text-brand group-hover:underline">{q.prompt}</span>
                    <span className="text-muted group-hover:text-brand">›</span>
                  </Link>
                  <span className="text-muted ml-4 shrink-0 tabular-nums">Difficulty {q.difficulty}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/modules/${moduleId}/topics/${topicId}/quiz`}
              className="inline-block rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-hover text-sm"
            >
              Start quiz
            </Link>
          </>
        )}
      </section>
    </main>
  );
}