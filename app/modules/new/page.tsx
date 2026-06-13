import Link from "next/link";
import { createModule } from "./actions";

/**
 * NewModulePage — form for creating a new module.
 *
 * Server component. The form's action prop points directly at the
 * createModule server action — no client JS or event handlers needed.
 */
export default function NewModulePage() {
  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">New module</h1>

      <form action={createModule} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Module code <span className="text-red-500">*</span>
          </span>
          <input
            name="code"
            required
            placeholder="CS2030"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Module name <span className="text-red-500">*</span>
          </span>
          <input
            name="name"
            required
            placeholder="Programming Methodology II"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Description{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </span>
          <textarea
            name="description"
            rows={3}
            placeholder="What this module covers..."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Create module
          </button>
          {/* Cancel goes back to the list without touching the database */}
          <Link
            href="/modules"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}