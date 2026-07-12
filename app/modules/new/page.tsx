import Link from "next/link";
import { createModule } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

/**
 * NewModulePage - form for creating a new module.
 *
 * Server component; the form's action prop points straight at the
 * createModule server action, so no client JS is needed here.
 */
export default function NewModulePage() {
  return (
    <main className="mx-auto max-w-xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">New module</h1>

      <form action={createModule} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">
            Module code <span className="text-mastery-weak">*</span>
          </span>
          <input
            name="code"
            required
            placeholder="CS2030"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Module name <span className="text-mastery-weak">*</span>
          </span>
          <input
            name="name"
            required
            placeholder="Programming Methodology II"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Description{" "}
            <span className="text-muted font-normal">(optional)</span>
          </span>
          <textarea
            name="description"
            rows={3}
            placeholder="What this module covers..."
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
          />
        </label>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton
            pendingText="Creating…"
            className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand-hover"
          >
            Create module
          </SubmitButton>
          {/* Cancel goes back to the list without touching the database */}
          <Link
            href="/modules"
            className="text-sm text-muted hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}