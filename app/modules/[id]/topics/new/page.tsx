import { createTopic } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: moduleId } = await params;

  // This is Pattern C: Binding the parent ID to the action
  const createInThisModule = createTopic.bind(null, moduleId);

  return (
    <main className="mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">New topic</h1>
      <form action={createInThisModule} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description (optional)</span>
          <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <SubmitButton pendingText="Creating…" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover">
          Create
        </SubmitButton>
      </form>
    </main>
  );
}