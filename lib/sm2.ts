// lib/sm2.ts
//
// SM-2 (Wozniak), simplified: quiz answers map to a quality grade (4 for
// correct, 2 for incorrect) instead of asking for a 0-5 self-rating after
// every question. The 0-5 machinery stays intact for a future grading UI.

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

  // Fail: reset the streak, see it again tomorrow. Ease stays untouched -
  // SM-2 penalizes a miss with the reset, not an ease hit. Easy to flip.
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