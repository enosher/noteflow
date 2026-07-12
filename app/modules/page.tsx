// The /modules list route - not to be confused with app/page.tsx.
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { loadSampleData } from "./sample-data-actions";
import EmptyState from "@/components/empty-state";

/**
 * ModulesPage - lists all modules belonging to the signed-in user.
 *
 * Server component, no client JS needed. RLS on `modules` scopes the
 * query to auth.uid() automatically, so no manual user_id filter.
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
        <h1 className="mb-4 text-2xl font-bold text-ink">Modules</h1>
        <p className="text-sm text-red-500">
          Could not load modules. Try refreshing the page.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      {/* Header row: title + primary action */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Modules</h1>
        <Link
          href="/modules/new"
          className="rounded-md bg-brand px-4 py-2 text-sm text-white transition-opacity hover:opacity-80"
        >
          + New module
        </Link>
      </div>

      {/* Empty state - shown on first login before any modules exist */}
      {modules.length === 0 ? (
        <div className="space-y-4">
          <EmptyState 
            message="Your modules organise everything — notes, questions, and quiz history live inside them."
            actionLabel="Create your first module"
            actionHref="/modules/new"
          />
          {/* Escape hatch from a blank first run: pulls in two ready-made
              modules with weeks of quiz history so Track/Adapt are visible
              without the user having to generate that history by hand. */}
          <form action={loadSampleData} className="text-center">
            <button
              type="submit"
              className="text-sm text-brand underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              Or load sample data to explore first
            </button>
          </form>
        </div>
      ) : (
        // Module list - each row links to the module detail page
        <ul className="space-y-2">
          {modules.map((m) => (
            <li key={m.id}>
              <Link
                href={`/modules/${m.id}`}
                className="flex items-start justify-between rounded-md border border-line bg-card p-4 transition-colors hover:border-brand/30 hover:shadow-sm"
              >
                <div>
                  <span className="text-sm font-semibold text-ink">{m.code}</span>
                  <span className="ml-4 text-sm text-muted">&#8250;</span>
                  {m.description && (
                    <p className="mt-1 text-xs text-muted">{m.description}</p>
                  )}
                </div>
                {/* Chevron gives a visual affordance that the row is clickable */}
                <span className="ml-4 text-sm text-muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}