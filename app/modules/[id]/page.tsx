import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton"; 
import { deleteModule } from "./edit/actions"; 
import { deleteTopic } from "./topics/[topicId]/edit/actions";

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
    <main className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/modules" className="text-sm text-blue-600 hover:underline">
          ← All modules
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{mod.code}</h1>
          <p className="text-gray-600">{mod.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/modules/${id}/edit`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
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
        <p className="text-gray-700 mt-2">{mod.description}</p>
      )}

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-lg font-semibold">Topics</h2>
        <Link
          href={`/modules/${id}/topics/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 text-sm"
        >
          + New topic
        </Link>
      </div>

      {topicsRes.error ? (
        <p className="text-red-600">Could not load topics. Try refreshing.</p>
      ) : topics.length === 0 ? (
        <p className="text-gray-600">No topics yet. Add your first one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {topics.map((t) => (
            <li key={t.id} className="rounded-md border p-4 hover:bg-gray-50 flex items-center justify-between">
              <Link href={`/modules/${id}/topics/${t.id}`} className="flex-1">
                <div className="font-medium">{t.name}</div>
                {t.description && <div className="text-sm text-gray-600">{t.description}</div>}
              </Link>
              <div className="flex gap-2 ml-4">
                <Link href={`/modules/${id}/topics/${t.id}/edit`} className="text-sm text-blue-600 hover:underline self-center">
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