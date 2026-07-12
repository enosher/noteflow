import { createClient } from "@/lib/supabase/server";
import { getRecommendedQuestion } from "@/lib/recommender";
import Link from "next/link";

// Scaffold, not the polished card: reference implementation for
// getRecommendedQuestion's output, on its own route so it won't collide
// with Spencer's in-progress dashboard work. Doubles as a debug view later.
export default async function RecommendationDebugPage() {
  const supabase = await createClient();
  const recommendation = await getRecommendedQuestion(supabase);

  return (
    <main className="mx-auto max-w-2xl p-6 sm:p-8">
      <Link href="/dashboard" className="text-sm text-brand hover:text-brand-hover">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 mb-2 font-display text-2xl font-semibold text-ink">
        Recommended next question
      </h1>
      <p className="mb-6 text-sm text-muted">
        Debug view - shows the scoring breakdown behind the pick, not just the result.
      </p>

      {!recommendation ? (
        <p className="text-sm text-muted">No recommendation yet - add some questions and take a quiz first.</p>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-line/70 bg-card p-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">{recommendation.topic_name}</p>
            <p className="mb-3 font-medium text-ink">{recommendation.prompt}</p>
            <Link
              href={`/modules/${recommendation.module_id}/topics/${recommendation.topic_id}/quiz`}
              className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Take this quiz
            </Link>
          </div>

          <h2 className="mb-3 text-lg font-semibold text-ink">Why this question?</h2>
          <div className="mb-4 space-y-2">
            {recommendation.breakdown.terms.map((term) => (
              <div
                key={term.label}
                className="flex items-center justify-between rounded-lg border border-line/70 bg-card p-3 text-sm"
              >
                <span className="text-ink">{term.label}</span>
                <span className="tabular-nums text-muted">
                  {term.rawScore.toFixed(2)} × {term.weight.toFixed(2)} ={" "}
                  <span className="font-medium text-ink">{term.weighted.toFixed(3)}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-right font-semibold tabular-nums text-ink">
            Total score: {recommendation.breakdown.total.toFixed(3)}
          </p>
        </>
      )}
    </main>
  );
}