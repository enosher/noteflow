import { createClient } from "@/lib/supabase/server";
import { getRecommendedQuestion } from "@/lib/recommender";
import Link from "next/link";

// This is a scaffold, not the polished dashboard card -- it's the
// reference implementation for what getRecommendedQuestion returns, kept
// as its own route (rather than inside app/dashboard/page.tsx) so it
// doesn't collide with Spencer's in-progress dashboard work. Once the
// field names below are confirmed, this becomes the spec for the real
// dashboard UI; it can stay around afterwards as a debug view either way.
export default async function RecommendationDebugPage() {
  const supabase = await createClient();
  const recommendation = await getRecommendedQuestion(supabase);

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">Recommended next question</h1>
      <p className="text-gray-600 text-sm mb-6">
        Debug view — shows the scoring breakdown behind the pick, not just the result.
      </p>

      {!recommendation ? (
        <p className="text-gray-600">No recommendation yet — add some questions and take a quiz first.</p>
      ) : (
        <>
          <div className="rounded-md border p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">{recommendation.topic_name}</p>
            <p className="font-medium mb-3">{recommendation.prompt}</p>
            <Link
              href={`/modules/${recommendation.module_id}/topics/${recommendation.topic_id}/quiz`}
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            >
              Take this quiz
            </Link>
          </div>

          <h2 className="text-lg font-semibold mb-3">Why this question?</h2>
          <div className="space-y-2 mb-4">
            {recommendation.breakdown.terms.map((term) => (
              <div
                key={term.label}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>{term.label}</span>
                <span className="text-gray-500">
                  {term.rawScore.toFixed(2)} × {term.weight.toFixed(2)} ={" "}
                  <span className="font-medium text-gray-900">{term.weighted.toFixed(3)}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-right font-semibold">
            Total score: {recommendation.breakdown.total.toFixed(3)}
          </p>
        </>
      )}
    </main>
  );
}