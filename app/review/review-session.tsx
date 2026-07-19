"use client";

import { useState, useTransition } from "react";
import { updateReviewSchedule, type DueReview } from "./actions";
import Link from "next/link";

// One card at a time. MCQ grades off the selection; short/long
// answers use reveal-then-self-grade: only the user knows whether their
// own answer actually matched.
export default function ReviewSession({
  initialQueue,
}: {
  initialQueue: DueReview[];
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  // Tracked alongside `done` so the session-end screen can show a real
  // score, not just a count reviewed - an M3 tester asked for at least
  // "a score at the very end to see how well the revision went."
  const [correctCount, setCorrectCount] = useState(0);
  // Which MCQ option the user picked, kept separate from `revealed` so
  // the button can be re-styled (correct/incorrect) after the pick
  // instead of the card just vanishing - the same tester said review
  // "never tell me whether I get it wrong or right."
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = queue[0];

  if (!current) {
    return (
      <div className="paper animate-rise-in mt-8 rounded-lg border border-line/70 bg-card p-8 text-center">
        <p className="font-display text-lg text-ink">You&apos;re all caught up!</p>
        <p className="mt-1 text-sm text-muted">
          You got {correctCount} of {done} correct in this session.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Return to dashboard
        </Link>
      </div>
    );
  }

  function grade(isCorrect: boolean) {
    startTransition(async () => {
      await updateReviewSchedule(current.question_id, isCorrect);
      setQueue((q) => q.slice(1));
      setRevealed(false);
      setSelectedOption(null);
      setDone((d) => d + 1);
      if (isCorrect) setCorrectCount((c) => c + 1);
    });
  }

  const isMcq = current.question_type === "mcq" && current.options;

  return (
    // The key prop forces React to remount the card and re-trigger the
    // rise-in animation every time the question changes.
    <div
      key={current.question_id}
      className="paper ruled-paper animate-rise-in-fast mt-6 rounded-lg border border-line/70 bg-card py-6 pl-11 pr-6"
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted">
        <span>{current.topic_name}</span>
        <span className="tabular-nums">{queue.length} left</span>
      </div>

      <p className="mt-4 text-lg leading-7 text-ink">{current.prompt}</p>

      {isMcq ? (
        <div className="mt-6 space-y-2">
          {current.options!.map((opt) => {
            // Before revealing: plain, clickable options. After: the
            // correct option is highlighted green, and - if the user
            // picked a different one - their pick is highlighted red,
            // so a wrong answer is visibly wrong instead of silently
            // moving on to the next card.
            const isCorrectOpt = opt === current.answer;
            const isPicked = opt === selectedOption;
            let style = "border-line bg-card text-ink hover:border-brand";
            if (revealed) {
              if (isCorrectOpt) {
                style = "border-(--mastery-strong) bg-(--mastery-strong)/10 text-ink";
              } else if (isPicked) {
                style = "border-(--mastery-weak) bg-(--mastery-weak)/10 text-ink";
              } else {
                style = "border-line bg-card text-muted";
              }
            }
            return (
              <button
                key={opt}
                disabled={revealed || isPending}
                onClick={() => {
                  setSelectedOption(opt);
                  setRevealed(true);
                }}
                className={`block w-full rounded-md border px-4 py-3 text-left text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-100 ${style}`}
              >
                {opt}
              </button>
            );
          })}

          {revealed && (
            <button
              disabled={isPending}
              onClick={() => grade(selectedOption === current.answer)}
              className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-card"
            >
              Reveal answer
            </button>
          ) : (
            <>
              <div className="rounded-md border border-line bg-surface p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Correct Answer</p>
                <p className="text-sm text-ink">{current.answer}</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  disabled={isPending}
                  onClick={() => grade(false)}
                  className="flex-1 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/20 disabled:opacity-50"
                >
                  Mark incorrect
                </button>
                <button
                  disabled={isPending}
                  onClick={() => grade(true)}
                  className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
                >
                  Mark correct
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
