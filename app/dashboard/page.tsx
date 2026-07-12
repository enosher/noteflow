import { createClient } from "@/lib/supabase/server";
import { getTopicAccuracy, getRecommendedQuestion } from "@/lib/recommender";
import { getOnboardingStatus } from "@/app/actions/onboarding";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MasteryDot } from "@/components/mastery-dot";
import GettingStarted from "@/components/getting-started";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch everything in parallel
  const [topicStats, recommendation, onboardingStatus] = await Promise.all([
    getTopicAccuracy(supabase),
    getRecommendedQuestion(supabase),
    getOnboardingStatus(),
  ]);

  const weakTopics = topicStats.filter((t) => t.is_weak);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-muted">Welcome, {user.email}</p>
      </div>

      {/* NEW: Getting Started Checklist */}
      <GettingStarted status={onboardingStatus} />

      {/* Weak topics - the "Track" feature's headline output */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">Weak topics</h2>
        {weakTopics.length === 0 ? (
          <p className="text-sm text-muted">
            {topicStats.length === 0
              ? "No quiz attempts yet - take a quiz to see your weak topics here."
              : "No weak topics flagged yet - keep going!"}
          </p>
        ) : (
          <ul className="space-y-2">
            {weakTopics.map((t) => (
              <li
                key={t.topic_id}
                className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 p-3 text-sm"
              >
                <Link
                  href={`/modules/${t.module_id}/topics/${t.topic_id}`}
                  className="font-medium !text-amber-900 hover:underline"
                >
                  {t.topic_name}
                </Link>
                <span className="text-amber-800">
                  {Math.round(t.accuracy * 100)}% ({t.attempts} attempts)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Accuracy by topic - full table, not just the weak ones */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">Accuracy by topic</h2>
        {topicStats.length === 0 ? (
          <p className="text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-2 font-medium text-muted">Topic</th>
                <th className="py-2 font-medium text-muted">Accuracy</th>
                <th className="py-2 font-medium text-muted">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {topicStats.map((t) => (
                <tr key={t.topic_id} className="border-b border-line/50">
                  <td className="py-2">
                    <span className="inline-flex items-center gap-2 text-ink">
                      <MasteryDot accuracy={t.accuracy} attempts={t.attempts} />
                      {t.topic_name}
                    </span>
                  </td>
                  <td className="py-2 tabular-nums text-ink">{Math.round(t.accuracy * 100)}%</td>
                  <td className="py-2 text-ink">{t.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Recommendation - the "Adapt" feature */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">Recommended next</h2>
        {recommendation ? (
          <div className="rounded-lg border border-line bg-card p-4 shadow-sm">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">
              {recommendation.topic_name}
            </p>
            <p className="mb-4 text-ink">{recommendation.prompt}</p>
            <Link
              href={`/modules/${recommendation.module_id}/topics/${recommendation.topic_id}/quiz`}
              className="inline-block rounded-md bg-brand px-4 py-2 text-sm text-white transition-opacity hover:opacity-80"
            >
              Practice this topic
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Add some questions and take a quiz to get a recommendation.
          </p>
        )}
      </section>
    </main>
  );
}