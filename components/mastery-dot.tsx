// The mastery scale as a component: sidebar rows, module pages,
// quiz results, and graph nodes all render mastery through this one file. 
// Thresholds match lib/weak-topics exactly.

export type MasteryTone = 'untested' | 'weak' | 'mid' | 'strong';

const WEAK_ACCURACY = 0.6;
const MIN_ATTEMPTS = 3;

export function masteryTone(
  accuracy: number | null,
  attempts: number
): MasteryTone {
  if (accuracy === null || attempts === 0) return 'untested';
  if (attempts >= MIN_ATTEMPTS && accuracy < WEAK_ACCURACY) return 'weak';
  if (accuracy < 0.8) return 'mid';
  return 'strong';
}

const LABEL: Record<MasteryTone, string> = {
  untested: 'Not tested yet',
  weak: 'Weak - needs practice',
  mid: 'Improving',
  strong: 'Strong',
};

export function MasteryDot({
  accuracy,
  attempts,
  size = 10,
  className = '',
}: {
  accuracy: number | null;
  attempts: number;
  size?: number;
  className?: string;
}) {
  const tone = masteryTone(accuracy, attempts);
  return (
    <span
      title={LABEL[tone]}
      aria-label={LABEL[tone]}
      className={`inline-block shrink-0 rounded-full align-middle ${className}`}
      style={{ background: `var(--mastery-${tone})`, width: size, height: size }}
    />
  );
}