# NoteFlow — Decisions Log

NUS Orbital 2026 · Apollo 11 · Team NoteFlow

This document records the non-obvious design and process decisions made on NoteFlow, and the reasoning behind them — not just what was decided, but why, so the rationale survives when looking back. This double as evidence for the Software Engineering principles documentation requirement.

---

## Project scope & stack

**Switched from React Native + Expo to Next.js + Supabase (12 May, Liftoff).**
After comparing the two stacks, web-first was judged a better fit given the team's experience level and offered faster iteration than mobile + native builds. Mobile setup hours from before the switch were kept in the project log since the time was genuinely spent evaluating tools.

**M2 feature cuts.** 
Collaborative Study Groups cut entirely; 
Study Analytics folded into the Track feature rather than built separately; 
A simple weighted-sum recommender instead of FSRS; 
Manual system testing with documented cases instead of Playwright E2E + CI. 
Reasoning: deliberate feature restraint to protect quality on the must-ship list rather than spreading a 4-week sprint across more features than the team could execute well.

---

## Database schema

**Notes attach to exactly one parent (topic XOR subtopic).** Enforced as a DB check constraint (`notes_exactly_one_parent`: `(topic_id is null) <> (subtopic_id is null)`) and again in server actions (explicitly setting the other field to `null` on insert). Reasoning: a note must live in exactly one place in the hierarchy; enforcing it at both the DB and app layer catches bugs early rather than relying on application code alone to get it right every time.

**MCQ options stored as a `jsonb` array on the `questions` table**, `null` for non-MCQ questions, with a DB check constraint requiring an array when `question_type = 'mcq'`. Reasoning: avoids a separate options table for what's fundamentally a small, variable-length list; jsonb keeps reads simple.

**`questions.subtopic_id` validity checked via trigger, not a CHECK constraint.** Postgres CHECK constraints can't reference other tables, so a trigger (`questions_check_subtopic_parent`) verifies that if a subtopic is set, it actually belongs to the question's `topic_id`. Reasoning: the schema allows narrowing a question to a subtopic, but a question's subtopic must stay consistent with its topic — the trigger is the only way to enforce that relationally.

**Hard cascade deletes throughout** (module → topic → subtopic/note/question → quiz_attempts). Reasoning: simplicity over soft-delete/archival, which wasn't a requirement for M2 scope.

**`quiz_attempts` is immutable** — no `updated_at` column or trigger. Reasoning: an attempt is a historical fact, not something that should ever be edited after the fact.

**RLS ownership flows from `modules.user_id`.** Topics, subtopics, notes, and questions verify ownership by joining back up to `modules`; `quiz_attempts` owns `user_id` directly since it's tied to the user, not the content hierarchy. Reasoning: a single source of truth for ownership avoids duplicating and potentially desyncing a `user_id` column on every child table.

**`handle_new_user` trigger creates a `profiles` row on signup.** Lesson learned the hard way: the trigger only fires for signups going forward, not retroactively — accounts created before the trigger existed have no profile row, which surfaced as a confusing FK constraint failure during seed data testing. Fixed with a one-off manual insert for those accounts; documented here so it doesn't get re-debugged from scratch if it resurfaces.

**M2 evaluator crash reports traced to pre-trigger profile gaps.** Investigated the M2 evaluator crash reports and confirmed the failures were caused by `auth.users` records that had no matching `profiles` row. There were **4 affected users** in total, all created before the `handle_new_user` trigger existed; two appeared to be ordinary/non-team accounts rather than obvious team test users. The missing rows were backfilled with a one-off `insert` on **8 July 2026**. Root cause was confirmed as historical data predating the trigger, not a residual signup/profile-creation bug.

---

## Storage

**`note-files` bucket is private, not public.** A public bucket would let anyone with a guessed or leaked URL read a file with no auth check at all; private + RLS/signed URLs gates every read.

**Upload path convention: `<userId>/<filename>`.** `storage.objects` has no `user_id` column of its own — the only way to express ownership is through the object's path. Supabase's `storage.foldername(name)` splits the path on `/`, so the first segment being the uploader's user id lets RLS policies compare it against `auth.uid()` the same way an ordinary `user_id` column would be compared elsewhere. This is the standard Supabase pattern for private, per-user buckets.

---

## Server action patterns

Three reference patterns were scaffolded so each could build feature pages from a known shape rather than reinventing the wiring each time.This also keeps merge conflicts down since one's extending a known pattern instead of guessing at one.

- **Pattern A — list page.** Server component, Supabase fetch scoped by RLS, empty state, error handling, Tailwind styling. (`app/modules/page.tsx`)
- **Pattern B — create form.** Server action with FormData validation, Supabase insert, `revalidatePath`, `redirect`. (`app/modules/new/`)
- **Pattern C — nested resource form.** Server action bound via `.bind(null, parentId)` so `<form action={...}>` receives a zero-argument function. Used consistently across topics, subtopics, notes, and questions. `DeleteButton` takes a pre-bound server action the same way.

---

## Quiz & grading

**MCQ answer-matching is enforced at question creation, not just at quiz time.** `submitAnswer()` does a plain string comparison between the submitted answer and the question's stored `answer` field. If the stored answer didn't exactly match one of the MCQ options, every attempt on that question would silently grade wrong with no obvious cause. Catching the mismatch at creation (`createQuestion` rejects it) is far cheaper than debugging it later in the quiz flow.

**`long_answer` questions are always marked correct in `submitAnswer()`.** String-match grading isn't meaningful for free-text answers, and marking them all "wrong" by default would unfairly tank a topic's accuracy score. The attempt is still recorded for time-tracking. Proper long-answer grading (rubric-based or LLM-assisted) is explicitly out of scope for M2.

**MCQ/short-answer grading uses trimmed, case-insensitive string matching.** Good enough for M2's scope; fuzzy matching or synonym handling would be unnecessary complexity against the must-ship list.

**Answer submission and attempt recording are one server action, not two.** Checking correctness and inserting the `quiz_attempts` row are the same database round-trip — splitting them into separate calls would add latency and complexity for no benefit.

---

## Weak topic detection & recommender

**Weak topic threshold: accuracy < 0.6 AND at least 3 attempts on that topic.** The attempt floor stops a single lucky or unlucky guess from flagging (or clearing) a topic. Both constants are exported (`WEAK_TOPIC_THRESHOLD`, `WEAK_TOPIC_MIN_ATTEMPTS`) so the README can document them directly and tests reference the same values instead of hardcoded magic numbers drifting out of sync.

**`getTopicAccuracy` aggregates via three flat JS-side queries instead of one deep Supabase embed or a SQL view.** Chosen for testability — each query is simply typed and the aggregation logic can be unit-tested in isolation (`lib/weak-topics.test.ts`). Acknowledged trade-off: this wouldn't scale indefinitely, and a SQL view/RPC would be the natural next step if data volume ever required it.

**Recommendation engine uses a simple weighted-sum formula instead of FSRS.** FSRS and other spaced-repetition algorithms were judged too ambitious given the team's stack-learning timeline. A transparent, tunable weighted sum is easier to explain, debug, and document at Apollo 11 than a black-box algorithm — and an undocumented recommender formula was the single most criticised gap across M1 peer/TA feedback, so documenting the formula itself was treated as a first-class deliverable, not an afterthought.

Weights (sum to 1): `topic_weakness = 0.4`, `recency_boost = 0.2`, `mistake_recency = 0.3`, `difficulty_match = 0.1`.

Term definitions:
- `topic_weakness` = `1 - accuracy`; defaults to `0.5` if the topic has no attempts yet (treated as "no evidence either way," not perfect or maximally weak).
- `recency_boost` = `1` if the question hasn't been attempted in the last 7 days (or never), else `0`.
- `mistake_recency` = `1` if the last attempt on the question was wrong, else `0` (`0` if there's no attempt history — no signal to act on).
- `difficulty_match` = `1 - abs(question_difficulty - user_avg_difficulty) / 4`.

**Recommendation engine scoped to "full depth with debug score breakdown," but flagged in advance as the first feature to cut if Week 3 slips.** Reasoning: ambitious scope is fine as long as the fallback is agreed before the deadline pressure hits, rather than improvised under it.

---

## Error handling & first-run experience (M3)

**Friendly error translation lives in one shared helper (`lib/errors.ts`), not per server action.** `friendlyMessage()` maps the handful of Postgres error codes a user can actually trigger from the UI (`23505` unique violation, `23503` FK violation, `23514` check violation, `42501` RLS denial) to plain-language copy, and falls through to the raw message for anything else - deliberately, so an unexpected error is still visible in server logs rather than silently swallowed. Every server action's `throw new Error(error.message)` was swapped for `throw new Error(friendlyMessage(error))`, a mechanical call-site change across 10 files with no other logic touched.

**`app/error.tsx` catches anything the friendly-message swap doesn't.** A route-segment error boundary is the backstop for anything thrown below the root layout, so no raw error reaches an evaluator's screen even if a call site was missed.

**Duplicate-create bug from double-clicking submit fixed by wiring the existing `SubmitButton` (`useFormStatus`) into 10 create/edit forms**, rather than adding new pending-state logic to each form individually. The component already existed from M2; this was rollout, not a rebuild.

---

## Demo account & first-run data (M3)

**Chose self-service sample data over a single shared demo login as the primary fix, then added the shared login as a second, faster path.** The M2 complaint was "empty first five minutes" specifically; the actual fix is that any account can become populated in one click (`app/modules/sample-data-actions.ts`, backed by the same `lib/seed-data.ts` dataset used by the `scripts/seed-all.ts` backfill script for existing accounts) - an evaluator signing up fresh gets the same demo-quality experience without needing a shared credential at all. The one-click `demo@noteflow.app` login (`app/login/demo-actions.ts`) was added afterwards as a faster path for time-pressed evaluators, not a replacement.

**Seed dataset covers two modules on purpose: CS2030S and GEA1000, not two CS modules.** GEA1000 is NUS's common quantitative-reasoning module; an evaluator or non-CS student shouldn't have to squint at a computing-only module to believe the app applies to them.

**`seedAccountData()` is additive and idempotent - it never deletes, and skips any module code the account already has.** This is what makes it safe to run against a real, non-demo account through the self-service path, and safe to re-run the backfill script repeatedly without checking "did I already do this?" first.

---

## Spaced repetition (SM-2) (M3)

**SM-2 maps correct/incorrect to a quality grade (4 or 2) instead of asking for a 0-5 self-assessment.** Wozniak's original algorithm expects the user to self-rate each review 0-5; adding that tap after every question was judged too much friction for the quiz flow already in place. The 0-5 machinery stays intact underneath so a future "that was easy" button could plug in a real quality value without changing `nextReviewState`'s signature.

**On failure, SM-2 resets the streak but does not touch the ease factor.** Wozniak's algorithm keeps ease unchanged below quality 3; the penalty for a wrong answer is being due again tomorrow, not a harder curve going forward. Documented explicitly in `lib/sm2.ts` because it's the easy detail to get backwards.

**SM-2 and the recommender are two different features answering two different questions, not overlapping ones.** SM-2's `/review` queue answers "what is due today" on a per-question time-based schedule; the recommender answers "what should I drill" based on topic weakness. This was flagged as a possible criticism at M1 ("isn't spaced repetition redundant with the recommender?") and resolved here as implemented truth rather than an assumption.

---

## Design tokens & dark mode (M3)

**Semantic CSS variables (`--color-surface`, `--color-ink`, `--color-brand`, etc.) replace hardcoded hex values in `globals.css`, with a `.dark` override block for each.** New components read a colour by what it means (surface, ink, brand) rather than its hex value, so a dark-mode pass is a single block of variable overrides instead of hunting every page for hardcoded colours.

**Theme toggle uses `useSyncExternalStore` to avoid a hydration mismatch, not `useState` + `useEffect`.** `next-themes` reads the theme from `localStorage` before React hydrates, so a naive default would flash the wrong icon on load; `useMounted()` renders a placeholder until the client is confirmed mounted, then swaps in the real toggle.

---

## Concept graph

**Cycle checking happens in application code (`lib/prereq.ts`), not the database.** A Postgres `CHECK` constraint can't traverse rows, so there's no way to reject a cyclic prerequisite chain at the schema level. `wouldCreateCycle` runs a BFS from the proposed prerequisite's own prerequisites back towards the target topic before any insert is attempted, rejecting cycles at write time with a clear error message instead of tolerating a meaningless graph at read time.

**Blocked topics are deprioritized in the recommender (0.5x score penalty), not excluded outright.** Excluding a blocked topic's questions entirely would leave the recommender with nothing to say on a module where every topic sits behind one shaky prerequisite. The penalty is applied after `getScoreBreakdown`, not folded into it, so the four scoring terms shown in the debug view still always sum to `breakdown.total`.

**Concept graph UI is a hand-rolled SVG, not a charting or graph library.** Positions come from a simple topological-levels layout (column = level, row = order within level) computed in `lib/prereq.ts`; nodes are draggable from there. No new dependency, in line with Apollo 11 scope - a library like react-flow or d3 would add real capability but wasn't judged necessary for a single-module DAG this small.

**`blockedTopics` and the graph's mastery colouring reuse existing constants instead of redefining them.** `WEAK_TOPIC_THRESHOLD` / `WEAK_TOPIC_MIN_ATTEMPTS` from `lib/weak-topics.ts` and `masteryTone` from `components/mastery-dot.tsx` are imported directly, so the concept graph's definition of "weak" can never quietly drift from the dashboard's.

**Prerequisite edges are same-module only, enforced by trigger.** Cross-module prerequisites (e.g. CS2030S requiring CS1101S) are a real concept but out of scope for M3; same shape as the existing `questions_check_subtopic_parent` trigger, since a `CHECK` constraint can't join across tables to verify the two topics share a `module_id`.

**The dynamic graph layout is a hand-rolled force simulation (`lib/graph-layout.ts`) — still no library.** Revisited when the interactivity pass added pan/zoom, physics, chain highlighting, and a minimap; the earlier no-dependency decision held. The deciding property a generic force layout (d3-force, react-flow) won't guarantee: each node's x stays anchored to its topological level, so the DAG always reads left-to-right regardless of how the physics settles. Pure and Supabase-free like `prereq.ts`, so the forces are pinned by unit tests rather than eyeballed in a browser.

**The simulation mutates a private node array in rAF callbacks and publishes immutable snapshots to React state once per tick.** Next.js 16's `react-hooks/refs` lint (React Compiler) rejects reading refs during render; snapshot-publishing satisfies the rule genuinely instead of suppressing it, at the cost of one shallow array copy per frame — negligible at tens of nodes.

---

## AI question generation (M3)

**Generation scoped to mcq and short_answer only, never long_answer.** long_answer questions are always auto-graded correct by submitAnswer() (string-match grading isn't meaningful for free text); an AI-generated long_answer question would inflate accuracy stats with corrects nobody earned. Enforced in lib/generated-questions.ts's VALID_TYPES set, not just the UI's type picker.

**Invalid drafts are dropped silently at parse time, not shown to the user or thrown as a batch failure.** One malformed item from Gemini (missing field, MCQ answer not matching an option) doesn't cost the whole generation - parseGenerated() drops just that item. Only structural failures (unparseable JSON, non-array top level) throw.

**Every draft is re-validated at save time, not just trusted from parsing.** isValidDraft() runs once after parsing and again, unconditionally, in saveGeneratedQuestions() - a user can edit a draft's answer in the review UI into something that no longer matches its own MCQ options.

**Dedup uses Jaccard token-overlap similarity (0.8 threshold) against the topic's existing questions and the rest of the batch, not exact string match.** Exact match misses trivial rephrasings; full semantic dedup would mean adding embeddings for one button click. 0.8 was picked by hand-checking real near-duplicate pairs.

**Notes scope is topic-level notes plus notes on all of the topic's subtopics, not topic-level only.** A topic's content usually lives partly in its subtopics; topic-level-only would starve the model of most of the real material for any topic using subtopics.

**Save batches all kept drafts into one insert + one redirect, rather than per-card insert+redirect.** The existing single-question createQuestion action redirects immediately after insert; reusing it per accepted card would navigate away from the review screen after the first accept and strand every other unreviewed proposal.

**Added questions.source ('manual' | 'ai', default 'manual') to tag provenance.** Costs nothing for existing rows; enables an accept-rate stat and distinguishes AI-originated questions going forward.

**Gemini called directly via fetch, no SDK dependency added.** Consistent with the project's lean dependency list; a single JSON-in/JSON-out call didn't justify a new package.

**responseMimeType: "application/json" plus a responseSchema are request-time constraints, not guarantees - parseGenerated() still validates independently.** If Gemini's schema enforcement has a gap, the failure mode is "fewer questions survive validation," never a bad row reaching the database.

**Free-tier disclosure still needed:** the free tier lets Google train on inputs/outputs - i.e. on users' study notes. Needs one line in the README's Known Limitations section (a writing task, not a code one - flagging here so it doesn't get lost).

**Expected AI-gen failures return `{ ok, message }` from the server action instead of throwing.** Discovered that Next.js blanks the message of any `Error` thrown from a Server Action once deployed in production, so every `friendlyMessage()`-wrapped error in the generation flow was silently swallowed on the live URL despite working locally. Since these are anticipated, recoverable failures (bad Gemini response, over the daily cap) rather than genuine crashes, `generateQuestionDrafts`/`saveGeneratedQuestions` return a result object the UI can render directly; unexpected errors still throw and hit `app/error.tsx`.

**Switched from `gemini-2.5-flash` to `gemini-3.5-flash` mid-M3.** `gemini-2.5-flash` started 404ing for new API keys on Google's side from 9 July 2026, ahead of its listed 16 October 2026 shutdown date (confirmed via the Google AI Developers Forum) — treated as a live compatibility break rather than a bug in our code, and Google's own listed replacement model was the safest swap.

**`gemini-3.5-flash`'s `thinkingLevel` needed setting to `"minimal"`, not left at its `"medium"` default.** The default draws thinking tokens from the same `maxOutputTokens` budget as the actual JSON answer, so the answer itself was getting truncated before parsing. Raised `maxOutputTokens` to 4096 as a second safety margin and added raw-response logging on parse failure so a similar truncation is diagnosable from the logs alone next time.

**A shared daily generation cap (`DAILY_GENERATION_CAP` / `ai_generation_log` table) protects one shared `GEMINI_API_KEY` used across every tester on this deployment.** Without a cap, a single enthusiastic tester could burn the whole team's quota before an evaluator gets to try the feature. Capped requests get a message pointing at the milestone video instead of a raw API error, since "watch the demo" is a more useful fallback than an opaque failure.

---

## Empty states, loading, and onboarding (M3)

**Loading skeletons were added per-route (`loading.tsx` in each data-heavy folder) rather than one shared global loading state.** Next.js's file-based loading convention already scopes a skeleton to the segment being fetched; a single global spinner would flash on every navigation, including ones that resolve instantly from cache.

**`EmptyState` and `Skeleton` were built as shared components rather than inlined per page.** Every list view (modules, module detail, topic detail) needed the same shape of "nothing here yet" messaging and the same shimmer treatment; a shared component keeps that consistent and means a future list view gets both for free.

**Getting-started checklist lives on the dashboard, not as a separate onboarding route.** The dashboard is already the first page a logged-in user lands on; a separate route would be one more click between signup and the checklist actually being seen. Checklist state is tracked per-account via `app/actions/onboarding.ts` rather than inferred from data presence, so dismissing a step is a deliberate action, not a guess based on whether a module happens to exist yet.

---

## Visual design system (M3)

**Design-token migration was finished as a dedicated pass (M3) rather than case-by-case as components were built.** Components written early in M2 predate the semantic token set introduced later and had accumulated hardcoded hex values; rather than fixing them opportunistically (which risked missing some indefinitely), a dedicated sweep across all remaining pages closed the gap in one pass, verified against the M1/M2 TA feedback that diagrams and visuals needed more polish.

**Visual language pass (paper-physics shadows, ruled/lined surfaces, type-register hierarchy) applied broadly across page files rather than to a handful of "hero" pages.** A visual identity that only appears on the dashboard and marketing-style pages reads as inconsistent the moment a user clicks into a form or detail page; applying it everywhere in one branch (`design/visual-refresh`) kept the whole app visually coherent at once rather than half-refreshed.

---

## Breadcrumbs

**Breadcrumb component does a Supabase fetch per crumb level rather than one combined query.** Documented and accepted as a known trade-off: simplicity of one query per level, over a more complex single query, given the hierarchy is only three levels deep (Module → Topic → Subtopic) — the extra round-trips are cheap in practice at this depth.

---

## Code comments & documentation

**All new code from Day 1 of M2 onward includes detailed "why" comments** (design decisions, RLS reasoning, edge cases) — not just restating what the code does. Explicitly not applied retroactively to old files. Reasoning: M1 TA feedback flagged "code needs comments"; rather than a one-time retrofit, this was adopted as an ongoing practice for everything written from that point forward.

**This decisions log was created after a server-action comment referenced a "decisions log" that didn't actually exist yet.** Started to make that reference true, and to double as evidence for the SE-principles documentation requirement.

---

## Git workflow

**Branches are created with `git checkout -B` (capital B), not `-b`.** `-B` resets to the branch if it already exists locally rather than erroring out silently and leaving uncommitted work stranded on the wrong branch; which is exactly what happened during M2, costing real debugging time.

**`supabase/.temp/*` is gitignored.** It's the Supabase CLI's local cache, regenerates automatically, and kept reappearing in `git add -A` before being explicitly ignored.

**One feature per branch; squash and merge; branch deleted after merge; one approving review required before merge (branch protection on `main`).** Keeps `main`'s history clean and ensures every change gets a second set of eyes given the two-person team.
