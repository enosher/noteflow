import { createTopic } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function NewTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: moduleId } = await params;

  // This is Pattern C: Binding the parent ID to the action
  const createInThisModule = createTopic.bind(null, moduleId);

  return (
    <main className="mx-auto max-w-xl p-6">
      <Breadcrumbs moduleId={moduleId} />
      
      <h1 className="mb-6 mt-4 text-2xl font-bold text-ink">New topic</h1>
      <form action={createInThisModule} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Name</span>
          <input 
            name="name" 
            required 
            className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" 
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Description (optional)</span>
          <textarea 
            name="description" 
            rows={3} 
            className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" 
          />
        </label>
        <SubmitButton 
          pendingText="Creating…" 
          className="rounded-md bg-brand px-4 py-2 text-white transition-opacity hover:opacity-80"
        >
          Create
        </SubmitButton>
      </form>
    </main>
  );
}