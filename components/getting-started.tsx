import Link from 'next/link';
import type { OnboardingStatus } from '@/app/actions/onboarding';

const STEPS = [
  { key: 'hasModule', label: 'Create a module', href: '/modules' },
  { key: 'hasNote', label: 'Add a note', href: '/modules' },
  { key: 'hasQuestion', label: 'Add practice questions', href: '/modules' },
  { key: 'hasAttempt', label: 'Take your first quiz', href: '/modules' },
] as const;

// Small SVG check, same 1.75 stroke as the app's icon set - a text "✓"
// glyph renders differently per platform font.
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export default function GettingStarted({
  status,
}: {
  status: OnboardingStatus;
}) {
  const remaining = STEPS.filter((s) => !status[s.key]);
  if (remaining.length === 0) return null; // all done, hide it for good

  const done = STEPS.length - remaining.length;

  return (
    <section className="paper rounded-lg border border-line/70 bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base italic text-ink">Getting started</h2>
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
                className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors
                  ${isDone ? 'border-brand bg-brand text-white' : 'border-line text-muted'}`}
              >
                {isDone ? <CheckIcon /> : null}
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
