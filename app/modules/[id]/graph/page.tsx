import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getModuleGraph } from "./actions";
import GraphView from "./graph-view";
import EmptyState from "@/components/empty-state";

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
    <main className="mx-auto max-w-5xl p-6">
      <Breadcrumbs moduleId={id} />
      <h1 className="mb-2 mt-4 text-2xl font-bold text-ink">{mod.code} - Concept graph</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Click a topic, then click another to mark the first as its prerequisite.
        Drag nodes to rearrange, scroll to zoom, drag the background to pan, and
        hover a topic to light up everything it depends on. A dashed ring means
        the topic is gated behind a weak prerequisite.
      </p>

      {graph.topics.length === 0 ? (
        <EmptyState
          message="Add topics to this module before mapping how they depend on each other."
          actionLabel="Add your first topic"
          actionHref={`/modules/${id}/topics/new`}
        />
      ) : (
        <GraphView moduleId={id} initialGraph={graph} />
      )}
    </main>
  );
}