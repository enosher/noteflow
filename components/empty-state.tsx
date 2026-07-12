import Link from 'next/link';

export default function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-card p-10 text-center">
      <p className="text-sm text-muted">{message}</p>
      <Link
        href={actionHref}
        className="mt-4 inline-block rounded bg-brand px-4 py-2 text-sm text-white transition-opacity hover:opacity-80"
      >
        {actionLabel}
      </Link>
    </div>
  );
}