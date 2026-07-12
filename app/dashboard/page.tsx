import { createClient } from "@/lib/supabase/server";
import { getTopicAccuracy, getRecommendedQuestion } from "@/lib/recommender";
import { getDueReviewCount } from "@/app/review/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MasteryDot, masteryTone, type MasteryTone } from "@/components/mastery-dot";

// Small hand-drawn icon set for the KPI strip - kept local to this file
// since nothing else uses them yet. Same stroke style as the theme
// toggle's sun/moon icons, so the line weight matches app-wide.
function Icon({ path, className = "" }: { path: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const ICON_PATHS = {
  accuracy: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01",
  modules: "M12 3 2 8l10 5 10-5-10-5ZM2 13l10 5 10-5M2 18l10 5 10-5",
  questions:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.5 9a2.5 2.5 0 0 1 4.9-.8c.3 1.5-1.9 1.8-2.4 3.3M12 16.5h.01",
  attempts: "M4 4h16v16H4V4ZM8 12l2.5 2.5L16 9",
  weak: "M12 2 22 20H2L12 2ZM12 9v5M12 17h.01",
  due: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
} as const;

const TIERS: MasteryTone[] = ["weak", "mid", "strong"];
const TIER_LABEL: Record<MasteryTone, string> = {
  untested: "untested",
  weak: "weak",
  mid: "improving",
  strong: "strong",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Last 7 calendar days, oldest first, for the activity chart.
  const dayStart = new Date();
  dayStart.setDate(dayStart.getDate() - 6);
  dayStart.setHours(0, 0, 0, 0);

  // Eight independent reads, run together rather than sequentially.
  // The count()/select() calls mirror the head-only pattern already
  // used by getDueReviewCount below - RLS scopes each to the current
  // user, so there's no manual filter to add.
  const [
    topicStats,
    recommendation,
    dueCount,
    moduleCount,
    questionCount,
    attemptCount,
    recentAttempts,
  ] = await Promise.all([
    getTopicAccuracy(supabase),
    getRecommendedQuestion(supabase),
    getDueReviewCount(),
    supabase.from("modules").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    supabase.from("questions").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    supabase
      .from("quiz_attempts")
      .select("attempted_at")
      .gte("attempted_at", dayStart.toISOString())
      .then((r) => r.data ?? []),
  ]);

  const weakTopics = topicStats.filter((t) => t.is_weak);
  const firstName = user.email?.split("@")[0] ?? "there";
  const recommendationTopic = recommendation
    ? topicStats.find((t) => t.topic_id === recommendation.topic_id)
    : null;

  // Topics grouped by tier, for the mastery breakdown grid below.
  const topicsByTier: Record<MasteryTone, typeof topicStats> = {
    untested: [],
    weak: [],
    mid: [],
    strong: [],
  };
  for (const t of topicStats) topicsByTier[masteryTone(t.accuracy, t.attempts)].push(t);

  const totalTopicAttempts = topicStats.reduce((sum, t) => sum + t.attempts, 0);
  const overallAccuracy =
    totalTopicAttempts > 0
      ? Math.round(
          (topicStats.reduce((sum, t) => sum + t.accuracy * t.attempts, 0) / totalTopicAttempts) * 100
        )
      : null;

  // Bucket the last 7 days of attempts by calendar day for a simple
  // bar chart - a real reading of study activity, not a placeholder.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(dayStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dayCounts = days.map(
    (d) => recentAttempts.filter((a) => new Date(a.attempted_at).toDateString() === d.toDateString()).length
  );
  const maxDayCount = Math.max(...dayCounts, 1);

  // The KPI strip - six real numbers, each pulled from a different
  // table, so this reads as an actual account snapshot rather than a
  // repeated set of decorative stat cards. Each gets its own icon and
  // tint so the strip has real color variety, not one flat gray row.
  const kpis: { label: string; value: string; icon: keyof typeof ICON_PATHS; color: string }[] = [
    {
      label: "Overall accuracy",
      value: overallAccuracy !== null ? `${overallAccuracy}%` : "—",
      icon: "accuracy",
      color: "var(--color-brand)",
    },
    { label: "Modules", value: String(moduleCount), icon: "modules", color: "var(--color-muted)" },
    {
      label: "Questions in bank",
      value: String(questionCount),
      icon: "questions",
      color: "var(--color-muted)",
    },
    {
      label: "Quiz attempts",
      value: String(attemptCount),
      icon: "attempts",
      color: "var(--mastery-strong)",
    },
    {
      label: "Weak topics",
      value: String(weakTopics.length),
      icon: "weak",
      color: "var(--mastery-weak)",
    },
    { label: "Due for review", value: String(dueCount), icon: "due", color: "var(--color-brand)" },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Welcome back, <em>{firstName}</em>
      </h1>

      {/* KPI strip - a real account snapshot, six independent numbers.
          A stat is not a card: these sit bare on the desk surface, big
          mono numerals with hairline rules between them on desktop,
          like a ledger line - no repeated card chrome. */}
      <div className="animate-rise-in mt-8 grid grid-cols-2 gap-y-6 border-b-4 border-double border-line/80 pb-6 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={i > 0 ? "lg:border-l lg:border-line/70 lg:pl-5" : ""}>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span style={{ color: kpi.color }}>
                <Icon path={ICON_PATHS[kpi.icon]} className="h-3.5 w-3.5" />
              </span>
              {kpi.label}
            </p>
            <p className="mt-1.5 font-mono text-3xl font-medium tabular-nums" style={{ color: kpi.color }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Row 1: the headline action beside a real activity chart. */}
      <div className="animate-rise-in mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12" style={{ animationDelay: "60ms" }}>
        {/* Recommendation - the "Adapt" feature and the one deliberately
            bold spot on this screen: today's study card. Faint ruled
            lines (echoing the auth panel's graph-paper texture) tie it
            to "notes"; the topic name gets a highlighter swipe - the
            only place --color-highlight is allowed to appear. */}
        <div className="paper ruled-paper rounded-lg border border-line/70 bg-card py-7 pl-11 pr-7 lg:col-span-7">
          {/* Dog-eared corner: the top-right fold that marks this as the
              page you're on. Pure CSS - the gradient's outer half matches
              the desk so the corner reads as cut, the inner half is the
              folded-over flap. */}
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 h-7 w-7 rounded-bl-md"
            style={{
              background:
                "linear-gradient(225deg, var(--color-surface) 0%, var(--color-surface) 48%, color-mix(in srgb, var(--color-line) 45%, var(--color-card)) 50%, var(--color-card) 100%)",
              boxShadow: "-1px 1px 2px rgba(0, 0, 0, 0.08)",
            }}
          />
          {recommendation ? (
            <div>
              <p className="text-sm text-muted">Recommended next</p>
              <p className="mt-2 font-display text-2xl leading-snug text-ink">
                {recommendation.prompt}
              </p>
              {/* The evidence line: which topic, and why it was picked. */}
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                <MasteryDot
                  accuracy={recommendationTopic?.accuracy ?? null}
                  attempts={recommendationTopic?.attempts ?? 0}
                />
                <mark className="rounded-sm bg-highlight px-1.5 py-0.5 font-medium text-ink">
                  {recommendation.topic_name}
                </mark>
                {recommendationTopic && recommendationTopic.attempts > 0 ? (
                  <span className="tabular-nums">
                    {Math.round(recommendationTopic.accuracy * 100)}% over{" "}
                    {recommendationTopic.attempts} attempt
                    {recommendationTopic.attempts === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span>not tested yet</span>
                )}
              </p>
              <Link
                href={`/modules/${recommendation.module_id}/topics/${recommendation.topic_id}/quiz`}
                className="mt-5 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                Practice this topic
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Add some questions and take a quiz to get a recommendation.
            </p>
          )}
        </div>

        {/* 7-day activity - attempts per day, bucketed from real
            quiz_attempts timestamps. */}
        <div className="paper rounded-lg border border-line/70 bg-card p-7 lg:col-span-5">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-base italic text-ink">Last 7 days</p>
            <p className="text-xs tabular-nums text-muted">{recentAttempts.length} attempts</p>
          </div>
          <div className="mt-5 flex h-20 items-end gap-2">
            {days.map((d, i) => (
              <div key={d.toISOString()} className="flex flex-1 flex-col items-center justify-end gap-1.5 self-stretch">
                {/* Direct value label - 7 points is small enough to label
                    outright instead of relying on hover-only tooltips. */}
                {dayCounts[i] > 0 && (
                  <span className="text-[10px] tabular-nums text-muted">{dayCounts[i]}</span>
                )}
                {/* Pencil-hatched fill for past days (matching the
                    hand-drawn stroke icons); today is solid brand so the
                    chart reads "you are here" without a legend. */}
                <div
                  className={`w-full rounded-t ${
                    i === 6 ? "bg-brand" : dayCounts[i] > 0 ? "border-t-2 border-brand/70" : "bg-line/80"
                  }`}
                  style={{
                    height: `${Math.max((dayCounts[i] / maxDayCount) * 72, dayCounts[i] > 0 ? 8 : 2)}%`,
                    ...(i !== 6 && dayCounts[i] > 0
                      ? {
                          backgroundImage:
                            "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-brand) 70%, transparent) 0 1.5px, transparent 1.5px 5px)",
                        }
                      : {}),
                  }}
                  title={`${dayCounts[i]} attempt${dayCounts[i] === 1 ? "" : "s"}`}
                />
                <span className="text-[10px] text-muted">
                  {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weak topics - a slim pill strip rather than a tall list tile,
          since it's usually a short set and deserves its own visual
          register (tags), distinct from the table and chart below. */}
      {weakTopics.length > 0 && (
        <div
          className="paper animate-rise-in mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-line/70 bg-card px-5 py-4"
          style={{ animationDelay: "120ms" }}
        >
          <span className="font-display text-base italic text-ink">Weak topics</span>
          {weakTopics.map((t) => (
            <Link
              key={t.topic_id}
              href={`/modules/${t.module_id}/topics/${t.topic_id}`}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-mastery-weak/10"
              style={{ borderColor: "var(--mastery-weak)", color: "var(--mastery-weak)" }}
            >
              {t.topic_name}
              <span className="tabular-nums opacity-70">{Math.round(t.accuracy * 100)}%</span>
            </Link>
          ))}
        </div>
      )}

      {/* Row 2: mastery breakdown beside the full accuracy table. */}
      <div className="animate-rise-in mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12" style={{ animationDelay: "180ms" }}>
        {/* Mastery breakdown - every attempted topic as a dot, grouped
            into columns by tier (a grouped beeswarm/dot-grid, not a
            free scatter) so it reads as structured data rather than
            noise. Dot size is uniform - only color and column carry
            meaning, per standard beeswarm practice. */}
        <div className="paper rounded-lg border border-line/70 bg-card p-7 lg:col-span-5">
          <p className="font-display text-base italic text-ink">Mastery breakdown</p>
          {topicStats.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {TIERS.map((tone) => (
                <div key={tone}>
                  <p className="text-xs text-muted">
                    {topicsByTier[tone].length} {TIER_LABEL[tone]}
                  </p>
                  <div className="mt-2 flex min-h-[72px] flex-wrap content-start gap-1.5 rounded-md bg-surface p-2">
                    {topicsByTier[tone].map((t) => (
                      <span
                        key={t.topic_id}
                        title={`${t.topic_name} · ${Math.round(t.accuracy * 100)}%`}
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ background: `var(--mastery-${tone})` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Take a quiz to start building your mastery breakdown.
            </p>
          )}
        </div>

        {/* Accuracy by topic - the widest tile, room for a real table
            with a header. */}
        <div className="paper rounded-lg border border-line/70 bg-card p-7 lg:col-span-7">
          <h2 className="font-display text-base italic text-ink">Accuracy by topic</h2>
          {topicStats.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing recorded yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="pb-2 text-left font-medium">Topic</th>
                  <th className="pb-2 text-right font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {topicStats.map((t) => (
                  <tr key={t.topic_id}>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-2.5 text-ink">
                        <MasteryDot accuracy={t.accuracy} attempts={t.attempts} />
                        {t.topic_name}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted">
                      {Math.round(t.accuracy * 100)}%
                      <span className="ml-1.5 text-xs">({t.attempts})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
