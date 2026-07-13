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
  const [isPending, startTransition] = useTransition();

  const current = queue[0];

  if (!current) {
    return (
      <div className="mt-8 rounded-lg border border-line bg-card p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-ink">You're all caught up!</p>
        <p className="mt-1 text-sm text-muted">
          You successfully reviewed {done} question{done !== 1 && "s"} in this session.
        </p>
        <Link 
          href="/dashboard" 
          className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
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
      setDone((d) => d + 1);
    });
  }

  const isMcq = current.question_type === "mcq" && current.options;

  return (
    <div className="mt-6 rounded-lg border border-line bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted">
        <span>{current.topic_name}</span>
        <span className="tabular-nums">{queue.length} left</span>
      </div>

      <p className="mt-4 text-lg text-ink">{current.prompt}</p>

      {isMcq ? (
        <div className="mt-6 space-y-2">
          {current.options!.map((opt) => (
            <button
              key={opt}
              disabled={revealed || isPending}
              onClick={() => {
                setRevealed(true);
                grade(opt === current.answer);
              }}
              className="block w-full rounded-md border border-line px-4 py-3 text-left text-sm text-ink transition-colors hover:border-brand focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-card"
            >
              Reveal answer
            </button>
          ) : (
            <>
              <div className="rounded-md border border-line bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Correct Answer</p>
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
                  className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
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