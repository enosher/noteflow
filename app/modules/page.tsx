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
      <main className="mx-auto max-w-3xl p-6 sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Modules</h1>
        <p className="mt-3 text-sm text-mastery-weak">
          Could not load modules. Try refreshing the page.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Modules</h1>
        <Link
          href="/modules/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          + New module
        </Link>
      </div>

      {/* Empty state - Spencer's shared component + his Day 2 copy,
          keeping the sample-data escape hatch. */}
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
            <button type="submit" className="text-sm text-brand underline underline-offset-2 hover:text-brand-hover">
              Or load sample data to explore first
            </button>
          </form>
        </div>
      ) : (
        // Module list - each row links to the module detail page
        <ul className="paper animate-rise-in divide-y divide-line/70 overflow-hidden rounded-lg border border-line/70 bg-card">
          {modules.map((m) => (
            <li key={m.id}>
              <Link
                href={`/modules/${m.id}`}
                className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
              >
                <div>
                  {/* Course codes in mono - codes are data, and the mono
                      face is the app's register for data. */}
                  <span className="font-mono text-xs font-medium text-brand">{m.code}</span>
                  <p className="mt-0.5 font-medium text-ink">{m.name}</p>
                  {m.description && (
                    <p className="mt-0.5 text-sm text-muted">{m.description}</p>
                  )}
                </div>
                {/* Chevron gives a visual affordance that the row is clickable */}
                <span className="mt-1 text-muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
