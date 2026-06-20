"use client";

import { useState } from "react";
import Link from "next/link";

// Define the shape of our questions based on Enosh's database schema
// Define the shape of our questions to match Supabase's generic types
interface Question {
  id: string;
  prompt: string;
  answer: string;
  question_type: string; // <-- Loosened to generic string
  options: any;          // <-- Loosened to any (Supabase sends Json)
  difficulty: number;
}

export function QuizClient({
  questions,
  moduleId,
  topicId,
}: {
  questions: Question[];
  moduleId: string;
  topicId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    // Check if the answer is correct (case-insensitive for text)
    const correct =
      userAnswer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();

    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) setScore((prev) => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setShowFeedback(false);
    } else {
      setIsFinished(true);
    }
  };

  // --- FINISHED STATE ---
  if (isFinished) {
    return (
      <div className="p-8 border rounded-lg bg-white text-center shadow-sm">
        <h2 className="text-3xl font-bold mb-4">Quiz Complete! 🎉</h2>
        <p className="text-lg text-gray-700 mb-6">
          You scored <span className="font-bold text-blue-600">{score}</span> out of {questions.length}.
        </p>
        <Link
          href={`/modules/${moduleId}/topics/${topicId}`}
          className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
        >
          Back to Topic
        </Link>
      </div>
    );
  }

  // --- ACTIVE QUIZ STATE ---
  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-6 text-sm text-gray-500">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>Difficulty: {currentQuestion.difficulty}/5</span>
      </div>

      <h2 className="text-xl font-medium mb-6">{currentQuestion.prompt}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Render different inputs based on question type */}
        {currentQuestion.question_type === "mcq" && currentQuestion.options ? (
          <div className="space-y-3">
            {(currentQuestion.options as string[]).map((opt, i) => (
              <label
                key={i}
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                  userAnswer === opt ? "bg-blue-50 border-blue-400" : "hover:bg-gray-50"
                } ${showFeedback ? "pointer-events-none opacity-80" : ""}`}
              >
                <input
                  type="radio"
                  name="mcq_answer"
                  value={opt}
                  checked={userAnswer === opt}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={showFeedback}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : currentQuestion.question_type === "long_answer" ? (
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={showFeedback}
            rows={4}
            className="w-full rounded-md border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Type your answer here..."
          />
        ) : (
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={showFeedback}
            className="w-full rounded-md border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Type your short answer..."
          />
        )}

        {/* Action Buttons & Feedback */}
        {!showFeedback ? (
          <button
            type="submit"
            disabled={!userAnswer.trim()}
            className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div
              className={`p-4 rounded-md border ${
                isCorrect ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <p className="font-bold">{isCorrect ? "✅ Correct!" : "❌ Incorrect"}</p>
              {!isCorrect && (
                <p className="mt-2 text-sm">
                  The correct answer was: <span className="font-semibold">{currentQuestion.answer}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
            >
              {currentIndex + 1 < questions.length ? "Next Question" : "Finish Quiz"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}