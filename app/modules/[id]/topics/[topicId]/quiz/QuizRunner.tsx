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

  // Starts the timer for a qns and clears any state left over from the previous qns.
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
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-2">Ready?</h2>
        <p className="text-gray-600 mb-6">
          This quiz has {questions.length} question{questions.length === 1 ? "" : "s"}.
        </p>
        <button
          onClick={handleBegin}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Begin
        </button>
      </div>
    );
  }

  if (stage === "finished") {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-2">Quiz complete</h2>
        <p className="text-gray-700 mb-6">
          You got {correctCount} out of {questions.length} correct.
        </p>
        <Link
          href={`/modules/${moduleId}/topics/${topicId}`}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to topic
        </Link>
      </div>
    );
  }

  // stage === "question"
  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">
        Question {index + 1} of {questions.length}
      </p>
      <h2 className="text-lg font-semibold mb-4">{current.prompt}</h2>

      {current.question_type === "mcq" && current.options ? (
        <div className="space-y-2 mb-4">
          {current.options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="answer"
                value={opt}
                checked={answer === opt}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!!feedback}
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
          className="w-full rounded-md border px-3 py-2 mb-4"
          placeholder="Type your answer..."
        />
      )}

      {feedback ? (
        <div className="space-y-3">
          <p className={feedback.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {feedback.isCorrect ? "Correct!" : `Not quite. The answer was: ${current.answer}`}
          </p>
          <button onClick={handleNext} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            {isLastQuestion ? "See results" : "Next question"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={submitting || !answer.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Submit answer"}
        </button>
      )}
    </div>
  );
}