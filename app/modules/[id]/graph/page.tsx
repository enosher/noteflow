import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getModuleGraph } from "./actions";
import GraphView from "./graph-view";
import EmptyState from "@/components/empty-state";

// Server shell: RLS + .single() confirms ownership and 404s missing rows,
// then the graph is fetched once so the client component starts with
// data already in hand - no first-paint spinner.
export default async function ConceptGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mod, error } = await supabase
    .from("modules")
    .select("id, code, name")
    .eq("id", id)
    .single();
  if (error || !mod) notFound();

  const graph = await getModuleGraph(id);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8">
      <Breadcrumbs moduleId={id} />
      <h1 className="font-display text-2xl font-semibold text-ink">{mod.code} - Concept graph</h1>
      <p className="mt-1 text-sm text-muted">
        Click a topic, then click another to mark the first as its prerequisite.
        Drag nodes to rearrange, scroll to zoom, drag the background to pan, and
        hover a topic to light up everything it depends on. A dashed ring means
        the topic is gated behind a weak prerequisite.
      </p>

      {graph.topics.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            message="Add topics to this module before mapping how they depend on each other."
            actionLabel="Add your first topic"
            actionHref={`/modules/${id}/topics/new`}
          />
        </div>
      ) : (
        <GraphView moduleId={id} initialGraph={graph} />
      )}
    </main>
  );
}
