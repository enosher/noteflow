import Link from 'next/link';
import type { OnboardingStatus } from '@/app/actions/onboarding';

const STEPS = [
  { key: 'hasModule', label: 'Create a module', href: '/modules' },
  { key: 'hasNote', label: 'Add a note', href: '/modules' },
  { key: 'hasQuestion', label: 'Add practice questions', href: '/modules' },
  { key: 'hasAttempt', label: 'Take your first quiz', href: '/modules' },
] as const;

export default function GettingStarted({
  status,
}: {
  status: OnboardingStatus;
}) {
  const remaining = STEPS.filter((s) => !status[s.key]);
  if (remaining.length === 0) return null; // all done, hide it for good

  const done = STEPS.length - remaining.length;

  return (
    <section className="mb-8 rounded-lg border border-line bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Getting started</h2>
        <span className="text-xs font-medium text-muted tabular-nums">
          {done}/{STEPS.length}
        </span>
      </div>
      <ol className="mt-4 space-y-3">
        {STEPS.map((s) => {
          const isDone = status[s.key as keyof OnboardingStatus];
          return (
            <li key={s.key} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs transition-colors
                  ${isDone ? 'border-brand bg-brand text-white' : 'border-line text-muted'}`}
              >
                {isDone ? '✓' : ''}
              </span>
              {isDone ? (
                <span className="text-muted line-through">{s.label}</span>
              ) : (
                <Link href={s.href} className="font-medium text-ink transition-colors hover:text-brand">
                  {s.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-muted">
        Finish these and NoteFlow starts recommending what to practise.
      </p>
    </section>
  );
}