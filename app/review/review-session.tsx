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
      <div className="mt-8 rounded-lg border border-line bg-card p-8 text-center">
        <p className="text-lg font-medium text-ink">Session complete - {done} reviewed</p>
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
    <div className="mt-6 rounded-lg border border-line bg-card p-6">
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
              className="block w-full rounded border border-line px-4 py-2 text-left text-sm text-ink transition hover:border-brand"
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
              className="rounded bg-brand px-4 py-2 text-sm text-white"
            >
              Show answer
            </button>
          ) : (
            <>
              <p className="rounded border border-line bg-surface px-4 py-3 text-sm text-ink">
                {current.answer}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  disabled={isPending}
                  onClick={() => grade(false)}
                  className="flex-1 rounded border border-line px-4 py-2 text-sm text-ink"
                >
                  Got it wrong
                </button>
                <button
                  disabled={isPending}
                  onClick={() => grade(true)}
                  className="flex-1 rounded bg-brand px-4 py-2 text-sm text-white"
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