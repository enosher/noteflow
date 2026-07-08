// app/modules/page.tsx not to be confused with app/page.tsx! This is the page that shows the list of modules, at the /modules route.
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { loadSampleData } from "./sample-data-actions";

/**
 * ModulesPage — lists all modules belonging to the signed-in user.
 *
 * Server component: fetches data at request time, no client JS needed.
 * RLS on the `modules` table scopes the query to auth.uid() automatically —
 * no manual .eq("user_id", ...) filter required.
 */
export default async function ModulesPage() {
  const supabase = await createClient();

  const { data: modules, error } = await supabase
    .from("modules")
    .select("id, code, name, description, created_at")
    .order("created_at", { ascending: false });

  // If Supabase returns an error (e.g. network issue, RLS misconfiguration),
  // show a plain message rather than crashing. Will be replaced with a
  // proper error UI in Week 4 polish pass.
  if (error) {
    console.error("[ModulesPage] Failed to load modules:", error.message);
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Modules</h1>
        <p className="text-red-600 text-sm">
          Could not load modules. Try refreshing the page.
        </p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-2xl">
      {/* Header row: title + primary action */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modules</h1>
        <Link
          href="/modules/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + New module
        </Link>
      </div>

      {/* Empty state — shown on first login before any modules exist */}
      {modules.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500 text-sm">No modules yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Create your first module to start organising your notes.
          </p>
          <Link
            href="/modules/new"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Create module
          </Link>
          {/* Escape hatch from a blank first run: pulls in two ready-made
              modules with weeks of quiz history so Track/Adapt are visible
              without the user having to generate that history by hand. */}
          <form action={loadSampleData} className="mt-3">
            <button
              type="submit"
              className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
            >
              Or load sample data to explore first
            </button>
          </form>
        </div>
      ) : (
        // Module list — each row links to the module detail page
        <ul className="space-y-2">
          {modules.map((m) => (
            <li key={m.id}>
              <Link
                href={`/modules/${m.id}`}
                className="flex items-start justify-between rounded-md border p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-sm">{m.code}</span>
                  <span className="text-gray-400 text-sm ml-4">&#8250;</span>
                  {m.description && (
                    <p className="text-gray-400 text-xs mt-1">{m.description}</p>
                  )}
                </div>
                {/* Chevron gives a visual affordance that the row is clickable */}
                <span className="text-gray-400 text-sm ml-4">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}