"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { generateQuestionDrafts, saveGeneratedQuestions } from "./actions";
import { isValidDraft, type GeneratedQuestion, type QuestionType } from "@/lib/generated-questions";

// Local-only id so React can key/update/discard individual cards without
// caring about the eventual DB id (there isn't one yet -- nothing here
// is persisted until Save). Never sent to the server.
type Draft = GeneratedQuestion & { _key: string };

// Explicit field-by-field rather than rest-destructuring `_key` away --
// picking fields by name is clearer than a `{ _key, ...rest }` that
// looks like it's discarding an unused variable (and trips the linter
// on exactly that).
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
      setError("Pick at least one question type.");
      return;
    }
    setError(null);
    const types: QuestionType[] = [
      ...(wantMcq ? (["mcq"] as const) : []),
      ...(wantShortAnswer ? (["short_answer"] as const) : []),
    ];
    startTransition(async () => {
      // generateQuestionDrafts returns a result object rather than
      // throwing -- Next.js redacts thrown-Error messages from Server
      // Actions in production, which would silently blank out every
      // friendly message below (rate limited, not configured, etc.).
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
      // On success this redirects and never returns to us at all. A
      // returned value here means the friendly-failure path, not a
      // thrown Error -- same redaction reasoning as handleGenerate above.
      const result = await saveGeneratedQuestions(topicId, drafts.map(stripLocalKey));
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  if (!inReview) {
    return (
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Number of questions</span>
          <input
            type="number"
            min={MIN_COUNT}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-24 rounded-md border px-3 py-2"
          />
          <span className="ml-2 text-xs text-gray-500">1-8</span>
        </label>

        <div>
          <span className="text-sm font-medium">Question types</span>
          <div className="mt-1 space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={wantMcq} onChange={(e) => setWantMcq(e.target.checked)} />
              Multiple choice
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={wantShortAnswer}
                onChange={(e) => setWantShortAnswer(e.target.checked)}
              />
              Short answer
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Long-answer questions aren&apos;t generated — they can&apos;t be auto-graded, so an AI-written
            one would count as correct no matter what you type. Add those by hand instead.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={isPending || noTypesSelected}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Reading your notes…" : "Generate questions"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.length === 0 ? (
        <p className="text-sm text-gray-600">
          Nothing left to review — everything was discarded.{" "}
          <button onClick={startOver} className="text-blue-600 hover:underline">
            Generate more
          </button>
        </p>
      ) : (
        <>
          {drafts.map((d) => {
            const valid = isValidDraft(d);
            return (
              <div key={d._key} className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>
                    AI suggestion · {d.question_type === "mcq" ? "Multiple choice" : "Short answer"}
                  </span>
                  {!valid && <span className="text-red-600 font-medium">Needs a fix before saving</span>}
                </div>

                <label className="block mb-2">
                  <span className="text-xs font-medium text-gray-600">Prompt</span>
                  <textarea
                    value={d.prompt}
                    onChange={(e) => updateDraft(d._key, { prompt: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </label>

                {d.question_type === "mcq" && d.options && (
                  <div className="mb-2 space-y-1">
                    <span className="text-xs font-medium text-gray-600">Options</span>
                    {d.options.map((opt, i) => (
                      <input
                        key={i}
                        value={opt}
                        onChange={(e) => updateOption(d._key, i, e.target.value)}
                        className="block w-full rounded-md border px-3 py-1.5 text-sm"
                      />
                    ))}
                  </div>
                )}

                <label className="block mb-2">
                  <span className="text-xs font-medium text-gray-600">Answer</span>
                  {d.question_type === "mcq" && (
                    <p className="text-xs text-gray-500">Must exactly match one of the options above.</p>
                  )}
                  <textarea
                    value={d.answer}
                    onChange={(e) => updateDraft(d._key, { answer: e.target.value })}
                    rows={1}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </label>

                <label className="block mb-3 w-28">
                  <span className="text-xs font-medium text-gray-600">Difficulty (1-5)</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={d.difficulty}
                    onChange={(e) => updateDraft(d._key, { difficulty: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </label>

                <button
                  onClick={() => discard(d._key)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Discard
                </button>
              </div>
            );
          })}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isPending || drafts.some((d) => !isValidDraft(d))}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving…" : `Save ${drafts.length} question${drafts.length === 1 ? "" : "s"}`}
            </button>
            <button onClick={startOver} className="text-sm text-gray-600 hover:underline">
              Start over
            </button>
            <Link
              href={`/modules/${moduleId}/topics/${topicId}`}
              className="text-sm text-gray-600 hover:underline"
            >
              Cancel
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
