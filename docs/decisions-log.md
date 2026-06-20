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
