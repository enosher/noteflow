import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getModuleGraph } from "./actions";
import GraphView from "./graph-view";

// Server shell: confirm the module exists and belongs to the user (RLS
// handles the ownership check, .single() throws if there's no row),
// then fetch the graph once so the client component starts with data
// already in hand. No first-paint spinner.
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
    <main className="p-6 max-w-5xl mx-auto">
      <Breadcrumbs moduleId={id} />
      <h1 className="text-2xl font-bold text-ink">{mod.code} — Concept graph</h1>
      <p className="mt-1 text-sm text-muted">
        Click a topic, then click another to mark the first as its prerequisite.
        Drag nodes to rearrange. A dashed ring means the topic is gated behind
        a weak prerequisite.
      </p>

      {graph.topics.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Add topics to this module before mapping how they depend on each other.
        </p>
      ) : (
        <GraphView moduleId={id} initialGraph={graph} />
      )}
    </main>
  );
}
