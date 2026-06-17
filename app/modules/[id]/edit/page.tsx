import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateModule } from "./actions";

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
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit module</h1>
      <form action={updateThisModule} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Code</span>
          <input
            name="code"
            required
            defaultValue={mod.code}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            required
            defaultValue={mod.name}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description (optional)</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={mod.description ?? ""}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Save changes
        </button>
      </form>
    </main>
  );
}