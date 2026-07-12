"use client";

import { useState } from "react";
import Link from "next/link";
import { submitAnswer } from "./actions";

export type QuizQuestion = {
  id: string;
  prompt: string;
  answer: string;
  options: string[] | null;
  question_type: "mcq" | "short_answer" | "long_answer";
  difficulty: number;
};

type Stage = "start" | "question" | "finished";

export function QuizRunner({
  questions,
  moduleId,
  topicId,
}: {
  questions: QuizQuestion[];
  moduleId: string;
  topicId: string;
}) {
  const [stage, setStage] = useState<Stage>("start");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[index];
  const isLastQuestion = index === questions.length - 1;

  // Starts the timer for a question and clears any leftover state from the last one.
  function resetForQuestion() {
    setStartedAt(Date.now());
    setAnswer("");
    setFeedback(null);
  }

  function handleBegin() {
    resetForQuestion();
    setStage("question");
  }

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    const timeTakenMs = Date.now() - startedAt;
    const { isCorrect } = await submitAnswer(current.id, answer, timeTakenMs);
    setFeedback({ isCorrect });
    if (isCorrect) setCorrectCount((c) => c + 1);
    setSubmitting(false);
  }

  function handleNext() {
    if (isLastQuestion) {
      setStage("finished");
    } else {
      setIndex((i) => i + 1);
      resetForQuestion();
    }
  }

  if (stage === "start") {
    return (
      <div className="paper animate-rise-in rounded-lg border border-line/70 bg-card p-10 text-center">
        <h2 className="font-display text-xl font-semibold text-ink">Ready?</h2>
        <p className="mt-2 text-sm text-muted">
          This quiz has {questions.length} question{questions.length === 1 ? "" : "s"}.
        </p>
        <button
          onClick={handleBegin}
          className="mt-6 rounded-md bg-brand px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Begin
        </button>
      </div>
    );
  }

  if (stage === "finished") {
    const pct = Math.round((correctCount / questions.length) * 100);
    const tone = pct >= 80 ? "strong" : pct >= 60 ? "mid" : "weak";
    return (
      <div className="paper animate-rise-in rounded-lg border border-line/70 bg-card p-10 text-center">
        {/* Result numeral in the mono face - same register as the
            dashboard KPI strip, so scores look like scores app-wide. */}
        <p
          className="font-mono text-5xl font-medium tabular-nums"
          style={{ color: `var(--mastery-${tone})` }}
        >
          {pct}%
        </p>
        <h2 className="mt-3 font-display text-xl font-semibold text-ink">Quiz complete</h2>
        <p className="mt-1 text-sm text-muted">
          You got {correctCount} out of {questions.length} correct.
        </p>
        <Link
          href={`/modules/${moduleId}/topics/${topicId}`}
          className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          Back to topic
        </Link>
      </div>
    );
  }

  // stage === "question"
  return (
    <div className="paper ruled-paper rounded-lg border border-line/70 bg-card py-7 pl-11 pr-7">
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="tabular-nums">
            Question {index + 1} of {questions.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line/50">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="mb-4 font-display text-lg font-semibold text-ink">{current.prompt}</h2>

      {current.question_type === "mcq" && current.options ? (
        <div className="mb-4 space-y-2">
          {current.options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line px-3.5 py-2.5 text-sm text-ink transition-colors hover:bg-surface has-[:checked]:border-brand has-[:checked]:bg-brand/[0.06]"
            >
              <input
                type="radio"
                name="answer"
                value={opt}
                checked={answer === opt}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!!feedback}
                className="accent-[var(--color-brand)]"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!feedback}
          rows={3}
          className="mb-4 w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/30"
          placeholder="Type your answer..."
        />
      )}

      {feedback ? (
        <div className="space-y-3">
          <p
            className="text-sm font-medium"
            style={{ color: feedback.isCorrect ? "var(--mastery-strong)" : "var(--mastery-weak)" }}
          >
            {feedback.isCorrect ? "Correct!" : `Not quite. The answer was: ${current.answer}`}
          </p>
          <button
            onClick={handleNext}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            {isLastQuestion ? "See results" : "Next question"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Submit answer"}
        </button>
      )}
    </div>
  );
}
