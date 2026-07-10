// lib/sm2.ts
//
// SM-2 (Wozniak), with one simplification: we log correct/incorrect,
// not a 0-5 self-assessed quality grade. Adding a "how hard was that?" tap
// after every question is too troublesome for the user — so we map
// correct -> 4, incorrect -> 2, and keep the 0-5 machinery underneath in
// case a "that was easy" button is introduced in the future.

export type ReviewState = {
  easeFactor: number;   // >= 1.3, starts at 2.5
  intervalDays: number; // 0 until the first successful review
  repetitions: number;  // consecutive successful reviews
};

export const INITIAL_STATE: ReviewState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
};

export function qualityFromCorrect(isCorrect: boolean): number {
  return isCorrect ? 4 : 2;
}

export function nextReviewState(prev: ReviewState, quality: number): ReviewState {
  if (quality < 0 || quality > 5) {
    throw new Error(`SM-2 quality must be 0-5, got ${quality}`);
  }

  // Fail: reset the streak, see it again tomorrow. Ease stays untouched —
  // SM-2's penalty for failing is the reset, not the ease hit. Easy line
  // to get backwards.
  if (quality < 3) {
    return { easeFactor: prev.easeFactor, intervalDays: 1, repetitions: 0 };
  }

  // Pass: 1 day, then 6, then scale by ease from there.
  const repetitions = prev.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = Math.round(prev.intervalDays * prev.easeFactor);

  // Wozniak's ease formula, floored at 1.3 so a run of "hard but correct"
  // answers can't spiral a card into being due every single day forever.
  const easeFactor = Math.max(
    1.3,
    prev.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return { easeFactor, intervalDays, repetitions };
}

export function nextDueDate(from: Date, intervalDays: number): Date {
  return new Date(from.getTime() + intervalDays * 24 * 60 * 60 * 1000);
}