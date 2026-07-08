'use client';

// Next.js renders this only after something below has thrown, so this
// is damage control. The digest maps to the server log line without 
// leaking the actual error message — what we can ask a user to quote in a bug report.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-24 max-w-md rounded-lg border border-[#C8D9F5] bg-[#FAFCFF] p-8 text-center">
      <h2 className="text-lg font-semibold text-[#1A1A2E]">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-[#5B6780]">
        The action didn&apos;t complete. Your data is safe — try again, or go
        back to the dashboard.
        {error.digest && (
          <span className="mt-1 block text-xs">Reference: {error.digest}</span>
        )}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded bg-[#1B4AA0] px-4 py-2 text-sm text-white"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded border border-[#C8D9F5] px-4 py-2 text-sm text-[#1B4AA0]"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}