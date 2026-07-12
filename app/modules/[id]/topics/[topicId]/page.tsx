import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { deleteSubtopic } from "./subtopics/[subtopicId]/edit/actions";
import { DeleteButton } from "@/components/DeleteButton";

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
          <p className="text-muted text-sm">No subtopics yet.</p>
        ) : (
          <ul className="space-y-2">
            {subtopics.map((s) => (
              <li key={s.id} className="rounded-md border border-line/70 bg-card p-3 text-sm flex items-center justify-between transition-colors hover:bg-surface">
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
              </li>
            ))}
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
          <p className="text-muted text-sm">No notes yet.</p>
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
          <p className="text-muted text-sm">No questions yet.</p>
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