"use client";

import { useState, useTransition } from "react";
import { updateReviewSchedule, type DueReview } from "./actions";

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
  const [isPending, startTransition] = useTransition();

  const current = queue[0];

  if (!current) {
    return (
      <div className="paper animate-rise-in mt-8 rounded-lg border border-line/70 bg-card p-8 text-center">
        <p className="font-display text-lg text-ink">
          Session complete - <span className="font-mono tabular-nums">{done}</span> reviewed
        </p>
        <a href="/dashboard" className="mt-4 inline-block text-sm text-brand">
          Back to dashboard
        </a>
      </div>
    );
  }

  function grade(isCorrect: boolean) {
    startTransition(async () => {
      await updateReviewSchedule(current.question_id, isCorrect);
      setQueue((q) => q.slice(1));
      setRevealed(false);
      setDone((d) => d + 1);
    });
  }

  const isMcq = current.question_type === "mcq" && current.options;

  return (
    <div className="paper ruled-paper mt-6 rounded-lg border border-line/70 bg-card py-6 pl-11 pr-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{current.topic_name}</span>
        <span className="tabular-nums">{queue.length} left</span>
      </div>

      <p className="mt-3 text-lg text-ink">{current.prompt}</p>

      {isMcq ? (
        <div className="mt-4 space-y-2">
          {current.options!.map((opt) => (
            <button
              key={opt}
              disabled={revealed || isPending}
              onClick={() => {
                setRevealed(true);
                grade(opt === current.answer);
              }}
              className="block w-full rounded-md border border-line px-4 py-2 text-left text-sm text-ink transition hover:border-brand"
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Show answer
            </button>
          ) : (
            <>
              <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink">
                {current.answer}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  disabled={isPending}
                  onClick={() => grade(false)}
                  className="flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-mastery-weak/10"
                  style={{ borderColor: "var(--mastery-weak)", color: "var(--mastery-weak)" }}
                >
                  Got it wrong
                </button>
                <button
                  disabled={isPending}
                  onClick={() => grade(true)}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--mastery-strong)" }}
                >
                  Got it right
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}