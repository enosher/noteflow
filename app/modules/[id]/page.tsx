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
    <main className="mx-auto max-w-3xl p-6">
      
      {/* Replaced the manual Link with the new Breadcrumbs component */}
      <Breadcrumbs moduleId={id} />

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{mod.code}</h1>
          <p className="text-muted">{mod.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/modules/${id}/graph`}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-line/20"
          >
            Concept graph
          </Link>
          <Link
            href={`/modules/${id}/edit`}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-line/20"
          >
            Edit
          </Link>
          <DeleteButton
            action={deleteModule.bind(null, id)}
            confirmMessage="Delete this module and everything in it? This can't be undone."
          />
        </div>
      </div>

      {mod.description && (
        <p className="mt-2 text-ink">{mod.description}</p>
      )}

      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Topics</h2>
        <Link
          href={`/modules/${id}/topics/new`}
          className="rounded-md bg-brand px-4 py-2 text-sm text-white transition-opacity hover:opacity-80"
        >
          + New topic
        </Link>
      </div>

      {topicsRes.error ? (
        <p className="text-sm text-red-500">Could not load topics. Try refreshing.</p>
      ) : topics.length === 0 ? (
        <EmptyState
          message="Topics break your module down into chapters or weeks. Add your first topic to start attaching notes and practice questions."
          actionLabel="Create your first topic"
          actionHref={`/modules/${id}/topics/new`}
        />
      ) : (
        <ul className="space-y-2">
          {topics.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md border border-line bg-card p-4 transition-colors hover:border-brand/30 hover:shadow-sm">
              <Link href={`/modules/${id}/topics/${t.id}`} className="group flex flex-1 items-center gap-3">
                <div>
                  <div className="font-medium text-ink group-hover:text-brand group-hover:underline">{t.name}</div>
                  {t.description && <div className="text-sm text-muted">{t.description}</div>}
                </div>
                <span className="text-lg text-muted transition-colors group-hover:text-brand">›</span>
               </Link>
              <div className="ml-4 flex gap-2">
                <Link href={`/modules/${id}/topics/${t.id}/edit`} className="self-center text-sm text-brand hover:underline">
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