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
    <main className="mx-auto max-w-xl p-6 sm:p-8">
      <Breadcrumbs moduleId={id} />
      <h1 className="font-display text-2xl font-semibold text-ink mb-6 mt-4">Edit module</h1>
      <form action={updateThisModule} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Code</span>
          <input
            name="code"
            required
            defaultValue={mod.code}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            required
            defaultValue={mod.name}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description (optional)</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={mod.description ?? ""}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <SubmitButton
          pendingText="Saving…"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Save changes
        </SubmitButton>
      </form>
    </main>
  );
}