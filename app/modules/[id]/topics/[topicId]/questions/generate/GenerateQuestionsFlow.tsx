"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { generateQuestionDrafts, saveGeneratedQuestions } from "./actions";
import { isValidDraft, type GeneratedQuestion, type QuestionType } from "@/lib/generated-questions";
import Skeleton from "@/components/skeleton";

type Draft = GeneratedQuestion & { _key: string };

function stripLocalKey(d: Draft): GeneratedQuestion {
  return {
    prompt: d.prompt,
    answer: d.answer,
    question_type: d.question_type,
    options: d.options,
    difficulty: d.difficulty,
  };
}

const MIN_COUNT = 1;
const MAX_COUNT = 8;

export function GenerateQuestionsFlow({
  topicId,
  moduleId,
}: {
  topicId: string;
  moduleId: string;
}) {
  const [count, setCount] = useState(5);
  const [wantMcq, setWantMcq] = useState(true);
  const [wantShortAnswer, setWantShortAnswer] = useState(true);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const noTypesSelected = !wantMcq && !wantShortAnswer;
  const inReview = drafts !== null;

  function handleGenerate() {
    if (noTypesSelected) {
      setError("Please select at least one question type to generate.");
      return;
    }
    setError(null);
    const types: QuestionType[] = [
      ...(wantMcq ? (["mcq"] as const) : []),
      ...(wantShortAnswer ? (["short_answer"] as const) : []),
    ];
    startTransition(async () => {
      const result = await generateQuestionDrafts(topicId, count, types);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDrafts(result.drafts.map((d, i) => ({ ...d, _key: `${Date.now()}-${i}` })));
    });
  }

  function updateDraft(key: string, patch: Partial<GeneratedQuestion>) {
    setDrafts((prev) => prev?.map((d) => (d._key === key ? { ...d, ...patch } : d)) ?? null);
  }

  function updateOption(key: string, index: number, value: string) {
    setDrafts(
      (prev) =>
        prev?.map((d) => {
          if (d._key !== key || !d.options) return d;
          const options = [...d.options];
          options[index] = value;
          return { ...d, options };
        }) ?? null
    );
  }

  function discard(key: string) {
    setDrafts((prev) => prev?.filter((d) => d._key !== key) ?? null);
  }

  function startOver() {
    setDrafts(null);
    setError(null);
  }

  function handleSave() {
    if (!drafts || drafts.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await saveGeneratedQuestions(topicId, drafts.map(stripLocalKey));
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  if (!inReview) {
    if (isPending) {
      return (
        <div className="space-y-4">
          <p className="animate-pulse text-sm font-medium text-ink">Analyzing notes & generating proposals…</p>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    return (
      <div className="space-y-5 rounded-lg border border-line bg-card p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-ink">Questions to generate</span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-24 rounded-md border border-line bg-transparent px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="text-xs text-muted">Range: 1–8</span>
          </div>
        </label>

        <div>
          <span className="text-sm font-medium text-ink">Question types</span>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input 
                type="checkbox" 
                checked={wantMcq} 
                onChange={(e) => setWantMcq(e.target.checked)}
                className="rounded border-line text-brand focus:ring-brand"
              />
              Multiple Choice (MCQ)
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={wantShortAnswer}
                onChange={(e) => setWantShortAnswer(e.target.checked)}
                className="rounded border-line text-brand focus:ring-brand"
              />
              Short Answer
            </label>
          </div>
          <p className="mt-3 leading-relaxed text-xs text-muted">
            Note: Long-answer questions cannot be auto-graded reliably, so AI generation is disabled for them. Please add those manually.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={noTypesSelected}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          Generate questions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.length === 0 ? (
        <div className="rounded-lg border border-line bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-ink">All proposals were discarded.</p>
          <button 
            onClick={startOver} 
            className="mt-4 inline-block rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/20"
          >
            Start a new batch
          </button>
        </div>
      ) : (
        <>
          {drafts.map((d) => {
            const valid = isValidDraft(d);
            return (
              <div key={d._key} className="rounded-lg border border-line bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted">
                  <span>
                    AI proposal · {d.question_type === "mcq" ? "Multiple choice" : "Short answer"}
                  </span>
                  {!valid && <span className="text-red-500">Action required: Fix before saving</span>}
                </div>

                <label className="mb-3 block">
                  <span className="mb-1 block text-xs font-medium text-ink">Prompt</span>
                  <textarea
                    value={d.prompt}
                    onChange={(e) => updateDraft(d._key, { prompt: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </label>

                {d.question_type === "mcq" && d.options && (
                  <div className="mb-3 space-y-2">
                    <span className="block text-xs font-medium text-ink">Options</span>
                    {d.options.map((opt, i) => (
                      <input
                        key={i}
                        value={opt}
                        onChange={(e) => updateOption(d._key, i, e.target.value)}
                        className="block w-full rounded-md border border-line bg-transparent px-3 py-1.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    ))}
                  </div>
                )}

                <label className="mb-4 block">
                  <span className="mb-1 flex items-center justify-between text-xs font-medium text-ink">
                    Answer
                    {d.question_type === "mcq" && (
                      <span className="font-normal text-muted">(Must exactly match one option)</span>
                    )}
                  </span>
                  <textarea
                    value={d.answer}
                    onChange={(e) => updateDraft(d._key, { answer: e.target.value })}
                    rows={1}
                    className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </label>

                <div className="flex items-end justify-between">
                  <label className="block w-32">
                    <span className="mb-1 block text-xs font-medium text-ink">Difficulty (1-5)</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={d.difficulty}
                      onChange={(e) => updateDraft(d._key, { difficulty: Number(e.target.value) })}
                      className="w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </label>

                  <button
                    onClick={() => discard(d._key)}
                    className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
                  >
                    Discard proposal
                  </button>
                </div>
              </div>
            );
          })}

          {error && (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isPending || drafts.some((d) => !isValidDraft(d))}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {isPending ? "Saving…" : `Accept & save ${drafts.length} question${drafts.length === 1 ? "" : "s"}`}
            </button>
            <button 
              onClick={startOver} 
              className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Discard all & start over
            </button>
            <Link
              href={`/modules/${moduleId}/topics/${topicId}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Cancel
            </Link>
          </div>
        </>
      )}
    </div>
  );
}