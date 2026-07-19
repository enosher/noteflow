import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteModule } from "./edit/actions";
import { deleteTopic } from "./topics/[topicId]/edit/actions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import EmptyState from "@/components/empty-state";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [moduleRes, topicsRes] = await Promise.all([
    supabase.from("modules").select("*").eq("id", id).single(),
    supabase
      .from("topics")
      .select("id, name, description")
      .eq("module_id", id)
      .order("order_index"),
  ]);

  if (moduleRes.error || !moduleRes.data) {
    notFound();
  }

  const mod = moduleRes.data;
  const topics = topicsRes.data ?? [];

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <Breadcrumbs moduleId={id} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium text-brand">{mod.code}</p>
          <h1 className="mt-0.5 font-display text-2xl font-semibold text-ink">{mod.name}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {/* Solid brand fill, not just an outline like Edit - this is a
              core feature (prerequisite mapping + weak-topic gating), not
              a secondary action, and was easy to overlook next to the
              visually identical Edit button before this change. */}
          <Link
            href={`/modules/${id}/graph`}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Concept graph
          </Link>
          <Link
            href={`/modules/${id}/edit`}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-surface"
          >
            Edit
          </Link>
          <DeleteButton
            action={deleteModule.bind(null, id)}
            confirmMessage="Delete this module and everything in it? This can't be undone."
          />
        </div>
      </div>

      {mod.description && <p className="mt-2 text-sm text-muted">{mod.description}</p>}

      <div className="mb-4 mt-9 flex items-center justify-between">
        <h2 className="font-display text-base italic text-ink">Topics</h2>
        <Link
          href={`/modules/${id}/topics/new`}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          + New topic
        </Link>
      </div>

      {topicsRes.error ? (
        <p className="text-sm text-mastery-weak">Could not load topics. Try refreshing.</p>
      ) : topics.length === 0 ? (
        <EmptyState
          message="Topics break your module down into chapters or weeks. Add your first topic to start attaching notes and practice questions."
          actionLabel="Create your first topic"
          actionHref={`/modules/${id}/topics/new`}
        />
      ) : (
        <ul className="paper animate-rise-in divide-y divide-line/70 overflow-hidden rounded-lg border border-line/70 bg-card">
          {topics.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface">
              <Link href={`/modules/${id}/topics/${t.id}`} className="group flex flex-1 items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium text-ink group-hover:text-brand group-hover:underline">{t.name}</div>
                  {t.description && <div className="mt-0.5 text-sm text-muted">{t.description}</div>}
                </div>
                <span className="text-muted group-hover:text-brand">›</span>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/modules/${id}/topics/${t.id}/edit`}
                  className="text-sm text-brand hover:text-brand-hover"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteTopic.bind(null, t.id)}
                  confirmMessage="Delete this topic and everything in it?"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
