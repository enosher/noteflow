import { createClient } from "@/lib/supabase/server";
import { getTopicAccuracy, getRecommendedQuestion } from "@/lib/recommender";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Both of these touch quiz_attempts/questions under the hood. Running
  // them in parallel instead of two sequential awaits means the page
  // doesn't get slower as a student's attempt history grows.
  const [topicStats, recommendation] = await Promise.all([
    getTopicAccuracy(supabase),
    getRecommendedQuestion(supabase),
  ]);

  const weakTopics = topicStats.filter((t) => t.is_weak);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {user.email}</p>
      </div>

      {/* Weak topics — the "Track" feature's headline output */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Weak topics</h2>
        {weakTopics.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {topicStats.length === 0
              ? "No quiz attempts yet — take a quiz to see your weak topics here."
              : "No weak topics flagged yet — keep going!"}
          </p>
        ) : (
          <ul className="space-y-2">
            {weakTopics.map((t) => (
              <li
                key={t.topic_id}
                className="rounded-md border border-amber-300 bg-amber-50 p-3 flex items-center justify-between text-sm"
              >
                <Link
                  href={`/modules/${t.module_id}/topics/${t.topic_id}`}
                  className="font-medium hover:underline"
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

      {/* Accuracy by topic — full table, not just the weak ones */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Accuracy by topic</h2>
        {topicStats.length === 0 ? (
          <p className="text-gray-500 text-sm">Nothing recorded yet.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2 font-medium text-gray-500">Topic</th>
                <th className="py-2 font-medium text-gray-500">Accuracy</th>
                <th className="py-2 font-medium text-gray-500">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {topicStats.map((t) => (
                <tr key={t.topic_id} className="border-b border-gray-100">
                  <td className="py-2">{t.topic_name}</td>
                  <td className="py-2">{Math.round(t.accuracy * 100)}%</td>
                  <td className="py-2">{t.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Recommendation — the "Adapt" feature */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recommended next</h2>
        {recommendation ? (
          <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
              {recommendation.topic_name}
            </p>
            <p className="mb-4">{recommendation.prompt}</p>
            <Link
              href={`/modules/${recommendation.module_id}/topics/${recommendation.topic_id}/quiz`}
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Practice this topic
            </Link>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Add some questions and take a quiz to get a recommendation.
          </p>
        )}
      </section>
    </main>
  );
}