'use client';

// Damage control for whatever throws below. The digest maps to a server
// log line without leaking the real error message - safe for a user to
// quote back in a bug report.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-24 max-w-md rounded-lg border border-line bg-card p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-muted">
        The action didn&apos;t complete. Your data is safe - try again, or go
        back to the dashboard.
        {error.digest && (
          <span className="mt-1 block text-xs">Reference: {error.digest}</span>
        )}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded bg-brand px-4 py-2 text-sm text-white"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded border border-line px-4 py-2 text-sm text-brand"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}