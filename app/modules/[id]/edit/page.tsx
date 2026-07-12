// The form for editing a module's code, name, and description.
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateModule } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mod, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !mod) notFound();

  const updateThisModule = updateModule.bind(null, id);

  return (
    <main className="mx-auto max-w-xl p-6">
      <Breadcrumbs moduleId={id} />

      <h1 className="mb-6 mt-4 text-2xl font-bold text-ink">Edit module</h1>
      <form action={updateThisModule} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Code</span>
          <input
            name="code"
            required
            defaultValue={mod.code}
            className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Name</span>
          <input
            name="name"
            required
            defaultValue={mod.name}
            className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Description (optional)</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={mod.description ?? ""}
            className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <SubmitButton
          pendingText="Saving…"
          className="rounded-md bg-brand px-4 py-2 text-white transition-opacity hover:opacity-80"
        >
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}