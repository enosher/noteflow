# NoteFlow

![Apollo 11](https://img.shields.io/badge/Orbital-Apollo%2011-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black)

A web app that helps university students organise study materials by topic, track quiz performance, and get adaptive practice recommendations that target their weak areas.

**Live demo:** https://noteflow-liart.vercel.app

## Table of Contents

1. [Targeted Level of Achievement](#targeted-level-of-achievement)
2. [Team](#team)
3. [Motivation](#motivation)
4. [Aim](#aim)
5. [User Stories](#user-stories)
6. [Features](#features)
7. [Spaced Repetition](#spaced-repetition)
8. [Concept Graph](#concept-graph)
9. [AI Question Generation](#ai-question-generation)
10. [System Design](#system-design)
11. [Recommendation Algorithm](#recommendation-algorithm)
12. [Implementation Challenges](#implementation-challenges)
13. [Why NoteFlow Instead of ChatGPT](#why-noteflow-instead-of-chatgpt)
14. [Tech Stack](#tech-stack)
15. [Development Plan](#development-plan)
16. [Software Engineering Practices](#software-engineering-practices)
17. [Project Management](#project-management)
18. [Testing](#testing)
19. [User Testing](#user-testing)
20. [Screenshots](#screenshots)
21. [Setup Instructions](#setup-instructions)
22. [Known Limitations](#known-limitations)
23. [Future Work](#future-work)
24. [Acknowledgements](#acknowledgements)

## Targeted Level of Achievement

Apollo 11

## Team

| Member | Role |
|--------|------|
| Spencer Ting | Full-stack development, project setup, deployment |
| Enosh Er | Full-stack development, database design, documentation |

## Motivation

University students in NUS face a common but underappreciated problem during revision: their study materials are fragmented across too many different places.

Lecture slides are stored in Canvas folders. Tutorial answers are buried in PDFs downloaded weeks ago. Personal summary notes are scattered across Notion, OneNote, or handwritten notebooks. Practice questions are saved in random locations - some in past-year paper PDFs, some in self-made documents, some in online question banks.

When exam season arrives, students spend a significant portion of their revision time just finding the right materials rather than actually studying. They struggle to know what to revise next, often defaulting to topics they are already comfortable with while unknowingly neglecting their weak areas.

The result: revision becomes inefficient, stressful, and poorly targeted - exactly when focus and efficiency matter most.

Existing tools address parts of this problem but not all of it. Note-taking apps like Notion organise materials but have no quiz or performance tracking. Flashcard apps like Anki track performance but are disconnected from a student's own notes and materials. There is no single tool that connects a student's study materials, their quiz attempts, and their weak areas into one adaptive system.

NoteFlow is built to fill this gap.

## Aim

NoteFlow is a web application that:

1. Allows students to organise all study materials (notes, questions, links, summaries) in a structured hierarchy of modules, topics, and subtopics
2. Records quiz attempts and tracks performance accuracy per topic over time
3. Automatically identifies **weak topics** based on a student's quiz history
4. Recommends targeted practice questions weighted by weak areas, recent mistakes, and revision frequency
5. Provides a revision dashboard giving students a clear picture of their strengths, weaknesses, and progress

The goal is to help students spend more time improving what they don't know, and less time searching for materials or repeating what they already do.

## User Stories

1. **As a student**, I want to organise my notes by module and topic so that I can find relevant materials quickly during revision without searching through multiple apps or folders.

2. **As a student**, I want to add practice questions to a topic so that my study materials and practice questions are linked together in one place, making revision more focused.

3. **As a student**, I want to attempt quizzes and have my answers recorded so that I can track my performance over time and understand where I am improving and where I am still struggling.

4. **As a student**, I want to see which topics I struggle with most so that I can prioritise my revision time on weak areas instead of wasting time on topics I already understand well.

5. **As a student**, I want to receive adaptive practice recommendations so that the questions I practise are targeted at my weaknesses rather than randomly selected, making every practice session more effective.

## Features

### 1. Organise Study Materials

NoteFlow provides a structured hierarchy of Modules → Topics → Subtopics that mirrors how university courses are organised.

Students can:

- Create, edit, and delete modules, topics, and subtopics
- Store notes under relevant topics and subtopics — including subtopic-only notes, which the
  underlying `createNote` action always supported but had no dedicated entry point until a
  manual QA pass caught the gap and a `subtopics/[subtopicId]/notes/new` route was added to
  close it
- Import notes by pasting markdown content directly into the editor
- View rendered markdown while preserving the original markdown source
- Create practice questions linked to topics
- Assign difficulty ratings (1-5) to questions
- Store model answers alongside questions

Questions support three types: `short_answer`, `long_answer`, and `mcq`. MCQ questions store answer choices as a JSON array and validate that the correct answer exactly matches one of the options. All types are associated with a specific topic for performance tracking and recommendation purposes.

This structure allows students to keep notes, revision materials, and practice questions within a single system instead of distributing them across multiple applications.

### 2. Track Quiz Performance and Identify Weak Topics

Every quiz attempt is recorded in the database with:

- `question_id`
- `is_correct`
- `time_taken_ms`
- `attempted_at`

From this attempt history, NoteFlow calculates topic-level accuracy and displays performance information on the revision dashboard.

Topic accuracy is computed as:

```text
Accuracy = Correct Attempts / Total Attempts
```

A topic is classified as a weak topic only when both conditions are satisfied:

- Accuracy < 60%
- At least 3 attempts have been recorded

This prevents topics from being incorrectly flagged after a single mistake while still identifying persistent areas of weakness.

The dashboard provides:

- Accuracy per topic
- Weak-topic identification
- Revision progress visibility
- Recommendation score breakdowns for debugging and transparency

### 3. Adaptive Practice Recommendations

NoteFlow recommends practice questions using a weighted recommendation algorithm that combines information about weak topics, recent mistakes, revision recency, and question difficulty.

Questions are ranked according to their recommendation score and the highest-ranked question is surfaced on the dashboard as the recommended next practice item.

Unlike simple random practice, recommendations prioritise:

- Topics where the student consistently performs poorly
- Questions related to recent mistakes
- Topics that have not been reviewed recently
- Questions with an appropriate difficulty level

For full details of the scoring model and design rationale, see the **Recommendation Algorithm** section below.

### 4. Spaced Repetition

NoteFlow schedules per-question review timing using a lightweight SM-2 algorithm, surfaced through the `/review` queue.

The review queue:

- Tracks ease factor, interval, and repetition count per `(user, question)` pair
- Extends the interval after each successful review, and resets the streak (without erasing the ease estimate already learned) after a failed one
- Answers "what is due today", a distinct question from the recommender's "what should I drill"

For the full SM-2 formula and how it differs from the adaptive recommender, see the **Spaced Repetition** section below.

### 5. Concept Graph

NoteFlow lets students map prerequisite relationships between topics and visualises them as an interactive graph.

The concept graph:

- Stores user-defined prerequisite edges, rejecting any edge that would create a cycle before it reaches the database
- Marks a topic as gated when it sits behind a weak prerequisite (accuracy below 60% with at least 3 attempts), halving its recommendation score rather than hiding it
- Lays out nodes so prerequisites always render to the left of their dependents

For the full design rationale, including why prerequisite edges are constrained to a single module, see the **Concept Graph** section below.

### 6. AI Question Generation

NoteFlow can generate draft practice questions from a topic's notes using Gemini, through a draft-and-review workflow rather than a direct write into the question bank.

Generation:

- Is restricted to `mcq` and `short_answer` questions, since `long_answer` attempts are currently auto-graded as correct
- Validates every draft twice, once on parse and again immediately before insertion, since a user can edit a draft in between
- Rejects near-duplicate questions using token-overlap similarity, checked against both the topic's existing bank and the rest of the same batch
- Is capped at 40 generation calls per 24 hours across all users, since the deployment shares one Gemini API key

For the full validation pipeline and design decisions, see the **AI Question Generation** section below.

### 7. Light and Dark Theme

A toggle in the nav bar (`components/theme-toggle.tsx`) switches the entire app between light and dark themes.

The toggle:

- Defaults to the browser's system preference on first visit
- Persists the user's choice across sessions and page reloads
- Applies on load with no flash of the wrong theme while the page hydrates

Implemented with `next-themes`, which handles system-preference detection and the flash-of-wrong-theme problem that a hand-rolled toggle would otherwise need to solve separately.

## Spaced Repetition

NoteFlow uses a lightweight SM-2 scheduler for per-question review timing. For each `(user, question)` pair, the scheduler stores three pieces of state:

- `easeFactor`: how easily the user is expected to remember the question. It starts at `2.5` and is floored at `1.3` so a difficult question never becomes mathematically unrecoverable.
- `intervalDays`: how many days to wait before the next review. It remains `0` until the first successful review creates a real interval.
- `repetitions`: the number of consecutive successful reviews for that question.

The quiz UI only records whether the answer was correct, so `qualityFromCorrect()` maps `correct -> 4` and `incorrect -> 2` on Wozniak's original 0-5 quality scale. This keeps the review flow frictionless while preserving the full SM-2 machinery internally. As recorded in the decisions log, "adding that tap after every question was judged too much friction for the quiz flow already in place. The 0-5 machinery stays intact underneath so a future 'that was easy' button could plug in a real quality value without changing nextReviewState's signature."

On a successful review (`quality >= 3`), the repetition streak increases and the interval is updated as follows:

- First successful repetition: `1` day
- Second successful repetition: `6` days
- Third and later successful repetitions: `round(previous interval x easeFactor)`

The **ease factor** itself is updated using Wozniak's SM-2 formula and then floored at `1.3`.

On a failed review (`quality < 3`), NoteFlow resets the streak rather than the difficulty estimate: `repetitions` becomes `0`, `intervalDays` becomes `1`, and `easeFactor` is left untouched. The decisions log explicitly calls this "the easy detail to get backwards" because a failure should make the item due soon again without erasing the long-term ease estimate already learned for that question.

Spaced repetition and the adaptive recommender solve related but different problems. The SM-2 review queue answers "what is due today" using per-question time-based scheduling. The recommender answers "what should I drill" using topic weakness, recent mistakes, recency, and difficulty. This distinction was raised as a possible Milestone 1 criticism — "isn't spaced repetition redundant with the recommender?" — and resolved as an implemented design separation rather than an assumption.

## Concept Graph

The concept graph models prerequisite relationships between topics. Edges are stored in the `topic_prerequisites` table as `(topic_id, prerequisite_topic_id)` pairs and are created by users through the graph UI. NoteFlow does not auto-extract prerequisite links from notes or question text.

Prerequisite edges are currently constrained to topics within the same module. This is enforced by a database trigger because a normal `CHECK` constraint cannot join against the `topics` table to compare both endpoints' `module_id` values. Cross-module prerequisites are a real concept, but they were deliberately kept out of scope for this milestone.

Cycles are rejected before they can enter the database. Before inserting a new edge, `wouldCreateCycle()` runs a breadth-first search from the proposed prerequisite's own prerequisites back toward the target topic. If the proposed write would make a topic depend on itself directly or indirectly, the insert is rejected with a clear error. This keeps the graph acyclic at write time instead of tolerating bad data and trying to recover at read time.

The graph also feeds into recommendations. If a question's topic sits behind a weak prerequisite, its recommender score is multiplied by `0.5` rather than being excluded completely. The weak-prerequisite definition is the same as the rest of the app: accuracy below `0.6` with at least `3` attempts. Unattempted prerequisites never block a topic, so a fresh module does not feel broken on the first click. This penalty is applied after `getScoreBreakdown`, which means the four displayed scoring terms still sum to `breakdown.total` and remain easy to inspect.

LLM-based relationship extraction was considered but consciously descoped. The milestone goal was to make prerequisite mapping reliable and inspectable first, so user-defined edges were chosen over automatically inferred relationships.

The graph layout is implemented as a hand-rolled force simulation in `lib/graph-layout.ts`, without adding `d3-force` or `react-flow`. Physics can move nodes vertically and spread them out, but each node's x-position stays pinned to its topological level. The guaranteed property is that prerequisites always render strictly to the left of their dependents, matching the left-to-right reading order of prerequisite knowledge. A unit test pins this behaviour by checking that a prerequisite remains strictly left of its dependent after the simulation settles.

## AI Question Generation

AI question generation is implemented as a draft-and-review workflow rather than a direct write into the question bank. Several controls are applied before a generated item can become a saved question.

First, generation is restricted to `mcq` and `short_answer` questions through `VALID_TYPES`. `long_answer` is permanently excluded because the current `submitAnswer()` flow auto-grades every long-answer attempt as correct. Allowing AI-generated long-answer questions would therefore quietly inflate topic accuracy statistics.

Second, the Gemini request asks for structured JSON using `responseMimeType: "application/json"` and a `responseSchema`, but this is treated only as a request-time hint. `parseGenerated()` never trusts the model response simply because it was schema-constrained; it parses and validates the returned data independently.

Third, `isValidDraft()` validates each draft before it is shown or saved. A valid draft must have a prompt of at least 10 trimmed characters, a non-empty answer, an integer difficulty from `1` to `5`, and a supported question type. MCQ drafts must also contain at least two non-blank options, and the answer must match one of those options verbatim.

Fourth, validation runs again immediately before insertion. This matters because users can edit generated drafts in the review UI; a draft that was valid when parsed can become invalid if, for example, the answer is edited so it no longer matches any MCQ option.

Fifth, duplicate detection uses Jaccard token-overlap similarity with a `0.8` threshold. The check runs against both the topic's existing questions and the rest of the same generated batch. This catches trivial rephrasings that exact string matching would miss.

Malformed generated items are dropped individually at parse time, so one bad item produces one fewer draft rather than failing the entire batch. Only structural failures, such as unparseable JSON or a non-array root, throw an error for the whole generation attempt.

Finally, AI generation is protected by a shared daily cap of `40` generation calls per 24 hours. This prevents one enthusiastic tester from exhausting the quota for the single shared `GEMINI_API_KEY` used by the deployment.

The `questions.source` field records whether a saved question came from `manual` entry or `ai` generation. It was added for future provenance tracking, but the current codebase does not query or display an accept rate. There is therefore no accept-rate number to report yet.

## System Design

### Architecture

The diagram below outlines NoteFlow's high-level architecture (see Figure 1).

![Architecture Diagram](docs/images/architecture.svg)
*Figure 1: Architecture Diagram*

NoteFlow uses a full-stack Next.js architecture with Supabase as the database and authentication layer.

- **Frontend:** Next.js App Router with React Server Components and Tailwind CSS, deployed on Vercel
- **Server-side application logic:** Next.js Server Components for data fetching and Server Actions for mutations
- **Database and auth:** Supabase (PostgreSQL) for data storage, with Supabase Auth for authentication

Milestone 2 expanded the architecture from an authentication prototype into a data-driven study application. Server Actions now form the mutation boundary for module, topic, subtopic, note, question, and quiz workflows; Supabase RLS policies scope user data to `auth.uid()`; and Supabase Storage is configured for file attachment support.

### Page Flow

The diagram below maps the application's page and route flow (see Figure 2).

![Page Flow](docs/images/page-flow.svg)
*Figure 2: Page Flow*

The Milestone 2 application includes authentication, dashboard, hierarchy management, note, question, quiz, and recommendation flows. Representative routes include:

- `/` - root page, redirects based on auth state
- `/signup` - new user registration
- `/login` - existing user authentication
- `/dashboard` - protected dashboard with performance and recommendation summary
- `/modules` - module list
- `/modules/new` - create module form
- `/modules/[id]` - module detail page
- `/modules/[id]/edit` - edit module form
- `/modules/[id]/topics/new` - create topic form
- `/modules/[id]/topics/[topicId]` - topic detail page with notes, questions, and quiz entry points
- `/modules/[id]/topics/[topicId]/edit` - edit topic form
- `/modules/[id]/topics/[topicId]/quiz` - quiz-taking flow for a topic
- `/dashboard/recommendation` - recommendation score breakdown debug view

### Database Schema

The entity-relationship diagram below shows the full schema (see Figure 3).

![ER Diagram](docs/images/er-diagram.svg)
*Figure 3: ER Diagram*

The database schema is fully implemented and deployed on Supabase. All application tables are protected using **Row Level Security (RLS)** policies scoped to `auth.uid()`, ensuring users can only access their own data.

Child tables do not carry a `user_id` column directly; ownership is enforced by joining up the hierarchy to `modules.user_id`. This keeps the schema normalised and avoids update anomalies at the cost of slightly more complex RLS policy definitions.

The main tables are:

#### profiles

extends Supabase auth.users
- `id` (UUID, primary key, references auth.users)
- `display_name` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### modules

academic unit (e.g. CS2030)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key -> profiles)
- `code` (text, e.g. "CS2030")
- `name` (text, e.g. "Programming Methodology II")
- `description` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### topics

within a module
- `id` (UUID, primary key)
- `module_id` (UUID, foreign key -> modules)
- `name` (text)
- `description` (text, nullable)
- `order_index` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### subtopics

within a topic
- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key -> topics)
- `name` (text)
- `order_index` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### notes

- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key -> topics, nullable)
- `subtopic_id` (UUID, foreign key -> subtopics, nullable)
- `title` (text)
- `content` (text, markdown, nullable)
- `file_url` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Notes must be attached to exactly one parent - either a topic or a subtopic, never both and never neither. This is enforced by a check constraint (`notes_exactly_one_parent`).

#### questions

- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key -> topics)
- `subtopic_id` (UUID, foreign key -> subtopics, nullable)
- `prompt` (text)
- `answer` (text)
- `options` (jsonb, nullable - stores MCQ answer choices; null for non-MCQ types)
- `question_type` (text, check: 'mcq' | 'short_answer' | 'long_answer')
- `difficulty` (integer, 1-5)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### quiz_attempts

- `id` (UUID, primary key)
- `user_id` (UUID, foreign key -> profiles)
- `question_id` (UUID, foreign key -> questions)
- `user_answer` (text, nullable)
- `is_correct` (boolean)
- `time_taken_ms` (integer, nullable)
- `attempted_at` (timestamp)

The following four tables/columns were added in Milestone 3 (`docs/m3_schema.sql`); the
tables above are the Milestone 2 base (`docs/m2_schema.sql`).

#### review_schedule

one row per `(user, question)`: current SM-2 state
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key -> profiles)
- `question_id` (UUID, foreign key -> questions)
- `ease_factor` (real, floored at 1.3 by a check constraint)
- `interval_days` (integer)
- `repetitions` (integer)
- `due_at` (timestamp)
- `last_reviewed_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

Unique on `(user_id, question_id)`, so each question has at most one active review state per
user.

#### topic_prerequisites

a directed edge for the concept graph: `topic_id` requires `prerequisite_topic_id`
- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key -> topics)
- `prerequisite_topic_id` (UUID, foreign key -> topics)
- `created_at` (timestamp)

A check constraint rejects self-edges (`topic_id <> prerequisite_topic_id`); a database
trigger rejects edges spanning two different modules, since a plain `CHECK` cannot join
against `topics` to compare both endpoints' `module_id`. Multi-step cycles are rejected in
application code (`lib/prereq.ts`), not the database — see Concept Graph below.

#### ai_generation_log

one row per Gemini call attempt, backing a shared daily generation cap
- `id` (UUID, primary key)
- `called_at` (timestamp)

No `user_id`: the single `GEMINI_API_KEY` on this deployment is shared across every tester,
not owned per-user, so RLS permits any signed-in user to read and insert rather than scoping
to a specific owner.

#### questions.source (added column)

`text`, `'manual' | 'ai'`, default `'manual'` — tags whether a question was hand-written or
AI-generated. Existing rows needed no backfill since the default covers them.

All mutable tables include an `updated_at` timestamp column, automatically maintained by a shared trigger function.

Topic accuracy is computed on demand through server actions that aggregate `quiz_attempts` by topic rather than being stored in a separate cached table. This avoids cache invalidation complexity: a cached table would need updating on every quiz attempt, adding write overhead and the risk of stale dashboard data. The trade-off is slightly higher read overhead per dashboard load, which is acceptable at the current scale.

## Recommendation Algorithm

The recommendation system ranks questions using a weighted scoring model designed to prioritise weak areas while remaining interpretable to students.

### Components

| Component | Formula | Purpose |
|------------|---------|---------|
| `weakness_score` | `1 - accuracy`; returns `0.5` for topics with no attempts | Measures how far below perfect accuracy the topic sits |
| `mistake_recency` | `1` if the most recent attempt was incorrect, `0` if correct or no history | Prioritises questions the student most recently got wrong |
| `recency_boost` | `1` if not attempted in the past 7 days or never attempted, `0` otherwise | Encourages revisiting neglected topics |
| `difficulty_match` | Similarity between question difficulty and current student performance | Promotes appropriately challenging questions |

### Scoring Formula

```text
score = 0.4w + 0.3m + 0.2r + 0.1d
```

where:

- w = weakness_score
- m = mistake_recency
- r = recency_boost
- d = difficulty_match

### Weight Selection

Weakness receives the highest weight because the primary objective of NoteFlow is targeted revision of weak areas.

Recent mistakes receive the second-highest weight because correcting misconceptions quickly is often more valuable than repeating already-mastered content.

Recency is weighted lower but still contributes to preventing topic neglect.

Difficulty matching receives the lowest weight because, at this stage of the project, broad question coverage is considered more important than precise difficulty calibration.

### Design Choice: Weighted Sum vs FSRS

We deliberately chose a weighted scoring model instead of FSRS for Milestone 2.

FSRS assumes relatively stable review schedules and larger review histories. In contrast, university students often revise irregularly around assignment and examination periods. A weighted scoring model better reflects the available data, remains explainable to students, and can be inspected through the dashboard's recommendation score breakdown view.

The formula's interpretability paid off during M3 manual QA: the demo account's recommendation was surfacing a Polymorphism question over a weaker Recursion topic, contradicting the account's own documented narrative. Because every term is a named, inspectable function, the cause was traceable directly rather than treated as a black-box anomaly — the seed data's attempt timestamp sat just outside the `recency_boost` window, zeroing out a term the narrative assumed would fire. The formula was working exactly as coded; only the seed data's timestamp didn't match its own story. See Known Issue `REC-01-MISMATCH` in `docs/manual-test-log.md` for the fix.

## Implementation Challenges

### Supabase Nested Embed Type Casting

Some analytics queries need to traverse multiple related tables, such as quiz attempts → questions → topics. The generated Supabase `Database` type accurately describes individual table shapes, but it does not always infer deeply nested join results from multi-level embeds.

To keep the rest of the code type-safe without falling back to `any`, the nested query result is cast through `unknown` into the expected runtime shape, with the cast documented where it is used so future maintainers know why it exists. This preserves TypeScript checking for downstream code while documenting the limitation in Supabase's generated types.

### Topic Accuracy Across RLS-Protected Tables

Computing topic accuracy appears simple: correct attempts divided by total attempts. In practice, it is split into targeted steps: fetch the topic's questions, fetch the current user's quiz attempts for those question IDs, then calculate the ratio in application code.

This approach is more verbose than a single aggregate query, but it keeps Row Level Security behaviour explicit and easier to debug. Each query operates on a clear set of rows, and `quiz_attempts` remains scoped to the authenticated user through RLS. The trade-off favours correctness and debuggability over a more compact SQL expression.

### Profile Creation Before Module Creation

Modules reference `profiles.id`, so a profile row must exist before a user can create their first module. During development, this created a failure mode where users who signed up before the profile trigger existed could authenticate successfully but fail when creating modules because the foreign key target was missing.

The fix was to add a `handle_new_user` database trigger that inserts a matching row into `profiles` whenever Supabase Auth creates a new user. This keeps application data aligned with authentication state and avoids treating a missing profile row as an application-level permissions issue.

### Demo Account Staleness

The shared `demo@noteflow.app` login is one account, reused by every visitor who clicks
"Try the demo." A manual QA pass caught the consequence of that: one session's graded
reviews, added notes, and quiz attempts persisted into the next visitor's "first look" at
the app, quietly drifting the demo away from its intended seeded state — including once
producing a false alarm where `/review` appeared to show zero cards due, which was actually
just SM-2's minimum one-day interval, not a bug, but only obvious after checking.

The fix runs `seedDemoAccountData()` (extracted into `lib/seed-demo-data.ts`, shared with
the CLI seeding script) immediately before logout, and only when the session's own user
matches `DEMO_EMAIL`. Because it runs as the caller's authenticated session rather than a
service-role client, Row Level Security scopes every delete and insert to `auth.uid()` by
construction — the reset can only ever act on the account that is actually logged in right
now, never an arbitrary one, even if the check above it were somehow bypassed.

### Keeping Recommendation Scores and Breakdowns in Sync

`scoreQuestion` computes the final recommendation score, while `getScoreBreakdown` computes the four component terms separately for the dashboard debug view. These functions intentionally serve different UI needs, but they must remain mathematically consistent.

A Vitest invariant test calls both functions on the same input and checks that the breakdown total equals the score returned by `scoreQuestion`. This turns a maintenance assumption into an executable test, so future changes to the scoring formula cannot silently desynchronise the recommendation logic and the explanation shown to users.

## Why NoteFlow Instead of ChatGPT

ChatGPT is useful for explaining concepts, answering questions, and generating study materials on demand. However, each interaction is largely driven by the current prompt and does not maintain a structured record of a student's revision history.

NoteFlow is designed around long-term learning data. It stores a student's modules, topics, notes, quiz attempts, topic-level accuracy, and identified weak areas in a persistent database. Recommendations are generated using actual performance history rather than being produced fresh from a prompt with no knowledge of previous revision behaviour.

In addition, NoteFlow's recommendation system is deterministic and auditable. Students can inspect the score breakdown for every recommended question and see exactly how weakness, mistake recency, revision recency, and difficulty matching contributed to the final score. This transparency helps students understand why a recommendation was made and makes the system easier to debug and improve.

The two tools serve different purposes: ChatGPT provides general-purpose assistance, while NoteFlow provides personalised revision support grounded in a student's own study history.

## Tech Stack

| Technology | Purpose | Why we chose it |
|---|---|---|
| Next.js 16 | Web framework | App Router enables server components and file-based routing. Seamless Vercel deployment. |
| TypeScript | Language | Type safety catches bugs at write-time. Familiar to team members with C++ background. |
| Vitest | Testing | Unit test framework for TypeScript; used to verify weak-topic detection boundary conditions and recommendation scoring invariants. |
| Tailwind CSS | Styling | Utility classes allow fast UI iteration without writing custom CSS files. |
| next-themes | Theming | Handles the light/dark toggle and system-preference detection without a flash of the wrong theme on load. |
| Supabase | Backend | Provides PostgreSQL, authentication, and file storage in one platform. Free tier is generous. Singapore region minimises latency. |
| PostgreSQL | Database | Relational model suits NoteFlow's hierarchical data (modules → topics → subtopics). |
| Vercel | Deployment | Zero-config deployment for Next.js. Auto-deploys on every push to main. Preview URLs on every PR. |

## Development Plan

### Milestone 1 (19 May - 1 June)
Working authentication flow (signup, login, dashboard, logout) deployed to Vercel, with route protection via Next.js middleware and Supabase Auth session management.

### Milestone 2 (2 June - 29 June)

Milestone 2 work happened in parallel throughout the month. Enosh primarily owned the data layer, server actions, database schema, and recommendation logic, while Spencer primarily owned UI pages, diagrams, content, manual testing, and video preparation.

Several features delivered in Milestone 2 went beyond the scope originally committed to in the Milestone 1 README.

The adaptive recommendation algorithm was explicitly scoped for Milestone 3 in the original development plan. It was designed, implemented, and tested during Week 3 of Milestone 2 — a full milestone ahead of schedule. The Milestone 1 README listed it under "Milestone 3 — Extension"; it now has its own section in this README with a documented formula, weight rationale, and FSRS design decision.

Automated unit testing was not part of the original plan. The Milestone 1 development plan listed only system testing for Milestone 2. Nineteen Vitest unit tests were written covering weak-topic boundary conditions and a recommendation scoring invariant, going beyond that commitment.

Two smaller additions were also made beyond the committed scope: a markdown note import feature and a recommendation score breakdown debug view, which surfaces the individual scoring components for each recommended question and was not planned at any milestone stage.

| Week | Dates | Enosh (data layer and backend) | Spencer (UI and content) |
|---|---|---|---|
| Week 1 | 2-8 Jun | Completed Next.js course chapters 3-16; ran M2 schema migration with 7 tables, RLS, and cascade deletes; generated TypeScript types; scaffolded module list and create-form pages as reference patterns | Completed Next.js course chapters 3-16; drew wireframes for all M2 pages in Excalidraw; agreed URL structure |
| Week 2 | 9-15 Jun | Implemented module, topic, and subtopic server actions for create, edit, and delete; set up Supabase Storage bucket with RLS policies; created `lib/storage.ts`; implemented notes server actions with file upload integration | Built module, topic, and subtopic list and form UI pages following the scaffolded patterns; built module and topic detail pages; added notes UI and navigation breadcrumbs across the hierarchy |
| Week 3 | 16-22 Jun | Implemented question server actions; built quiz-taking flow with state machine, timer, and attempt recording; implemented weak-topic detection; built recommendation algorithm in `lib/recommender.ts`; added 19 Vitest unit tests; implemented markdown import page, debug score breakdown view, and NavBar | Built question creation UI; built quiz start, answer, and results screens; built dashboard UI showing per-topic accuracy and weak topics; built markdown paste import UI |
| Week 4 | 23-29 Jun | Code comments audit, bug-fix sweeps, and README technical sections including algorithm, software engineering practices, and development plan | Manual system testing; architecture, page flow, and ER diagrams; M2 video recording; and README documentation sections |

### Milestone 3 (30 June - 27 July)

M3 work was more back-loaded and more Enosh-heavy than the original plan assumed. Week 1
has no logged hours from either team member (a gap between the M2 submission push and M3
restarting). Spencer's planned M3 work — user testing and the demo video — was partly
underway as of this documentation pass (19 July): the user testing round ran in Week 3
(see [User Testing](#user-testing)), and the demo video is still outstanding.
`docs/project-log.md` is the source of truth on logged hours.

| Week | Dates | Enosh (data layer and backend) | Spencer (UI, testing, and video) |
|---|---|---|---|
| Week 1 | 30 Jun - 6 Jul | No logged hours | No logged hours |
| Week 2 | 7-13 Jul | Error handling and first-run polish: `SubmitButton` pending-state rollout across 10 forms, shared friendly-error translation (`lib/errors.ts`) plus a route-level error boundary, dark/light theme tokens and toggle; root-caused and backfilled 4 orphaned `profiles` rows behind the M2 evaluator crash reports; built self-service sample-data seeding and one-click demo login. Spaced repetition: SM-2 core with 12 boundary tests, review backend actions, `/review` page and session UI. Concept graph: prerequisites schema, cycle-detection and topological-layout library (12 tests), graph server actions, interactive SVG graph view, force-simulation physics (13 tests), dynamic canvas rewrite with pan/zoom/minimap. AI question generation: validation and dedup library (46 tests), Gemini integration, generation review UI, a production error-redaction fix, a model swap after `gemini-2.5-flash` was deprecated ahead of schedule, a response-truncation fix, and a shared daily generation cap. Visual design-token migration across ~25 page files. | No logged hours |
| Week 3 | 14-20 Jul | Manual QA pass across 37 test cases (`docs/manual-test-log.md`), including root-causing and fixing a recommendation-scoring bug (see Known Issue `REC-01-MISMATCH` below) and building a reset-on-logout mechanism for the shared demo account. README update for M3 (this pass). | Ran M3 user testing: 5 participants via the same asynchronous task-sheet method as M2 (see [User Testing](#user-testing)) |
| Week 4 | 21-27 Jul | Final documentation, remaining bug fixes, submission prep | Planned: M3 demo video with live screen recording |

## Software Engineering Practices

### Consistent Error Handling

All server actions and data-access functions that interact with Supabase follow the same error-handling pattern. This is applied across server actions, for example in `app/modules/new/actions.ts` when creating a module.

```ts
const { error } = await supabase
  .from('modules')
  .insert(moduleData)

if (error) {
  console.error(error)
  throw new Error(error.message)
}
```

Errors are first logged on the server so they appear in local development logs and Vercel deployment logs. They are then rethrown as standard JavaScript errors, allowing Next.js error boundaries to handle failures consistently. This prevents database failures from being silently ignored and ensures that problems are visible during debugging. This follows the DRY principle by using one consistent error-handling shape instead of reinventing it in each server action.

### Input Normalisation

Before data is written to the database, freeform text inputs are normalised in create and update server actions. This is used at the write boundary before inserting or updating Supabase rows, for example in module, topic, subtopic, note, and question actions.

```ts
const code = formData.get('code') as string
const name = formData.get('name') as string
const description = formData.get('description') as string

const moduleData = {
  code: code.trim(),
  name: name.trim(),
  description: description.trim() || null,
}
```

String fields are trimmed using `.trim()`, while optional fields convert empty strings (`""`) into `null`. Database queries can therefore rely on `IS NULL` semantics instead of handling both `NULL` and empty strings.

An exception is note content stored as markdown. Markdown whitespace can be semantically meaningful, so note bodies are preserved exactly as entered by the user. This keeps the boundary between user input and stored data clear: normalisation happens at the write boundary, not inside individual form components.

### Revalidate-Then-Redirect

After every successful mutation, affected routes are revalidated before redirecting the user. This is applied in update actions such as `app/modules/[id]/edit/actions.ts`, where both the list view and detail view can become stale after a module is edited.

```ts
revalidatePath('/modules')
revalidatePath(`/modules/${moduleId}`)
redirect(`/modules/${moduleId}`)
```

This ensures that cached pages never display stale data after create, update, or delete operations. The number of revalidation calls depends on how many views render the affected data. For example, updating a module requires revalidating both the module list page and the module detail page before redirecting. This applies Separation of Concerns by handling data freshness at the mutation boundary instead of requiring every page to manage cache invalidation manually.

### Database-Generated TypeScript Types

Supabase types were generated directly from the deployed database schema using `supabase gen types typescript` and wired into both browser and server Supabase client helpers through the `Database` generic, for example in `lib/supabase/server.ts` and `lib/supabase/client.ts`.

```ts
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'

const supabase = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies }
)
```

This gives compile-time checking for table names, column names, query results, and inserted values. If a column is renamed or a table shape changes, TypeScript can surface the mismatch before the code runs. It also improves development speed by providing IDE autocompletion for Supabase queries throughout the codebase.

This practice complements the database migration workflow by keeping the application layer aligned with the actual Supabase schema instead of relying on manually maintained TypeScript interfaces. It is an application of Single Source of Truth: the deployed database schema defines the types used by the application.

## Project Management

### Version Control Workflow

- Branch protection was enforced on `main` throughout Milestone 2
- All work was completed through feature branches and pull requests
- One approving review was required before merge
- Squash-and-merge was used for all pull requests to maintain a clean project history
- Conventional commit prefixes (`feat:`, `fix:`, `docs:`, `chore:`) were used to categorise changes

### Coordination and Scope Management

To reduce merge conflicts, the team established a file-ownership matrix during Week 1 that clearly separated responsibilities between the data layer and UI layer.

Daily morning check-ins were used to coordinate file ownership and planned work for the day, while `docs/project-log.md` recorded hours spent and completed tasks.

Major architectural and scope decisions were documented in `docs/decisions-log.md`, including recommendation algorithm design choices, the decision not to adopt FSRS for Milestone 2, and the prioritisation order for potential scope reductions.

### Issue Tracking

GitHub Issues were used to track bugs, implementation tasks, and documentation work throughout development. Issues provided a lightweight workflow for assigning work, recording progress, and ensuring unresolved problems were not lost between development sessions.

### Scope Decisions

Several features were deliberately deferred or cut to ensure reliable delivery of the core functionality within the Milestone 2 timeline.

- **Collaborative Study Groups** — cut entirely; the core revision workflow does not require collaboration and the added complexity would have displaced higher-priority features
- **PDF import** — deferred; markdown paste covers the primary use case with significantly less implementation risk
- **File upload UI** — deferred; the database schema and Supabase Storage bucket are configured, but the upload interface was cut to keep Milestone 2 focused on the quiz and recommendation workflows. Built in Milestone 3 (see Changes Made under User Testing) and verified working in the M3 manual QA pass, including a signed-URL round trip on the live deployment.
- **FSRS scheduling algorithm** — replaced with a weighted scoring model for the reasons described in the Recommendation Algorithm section
- **Content types (important links and formula summaries)** — listed as planned content types per topic in the Milestone 1 README; not implemented in Milestone 2 and deferred pending demand from user testing
- **Dashboard accuracy trends and strong topic highlighting** — the Milestone 1 plan described showing accuracy trends over time and explicitly highlighting strong topics; the current dashboard shows current per-topic accuracy but historical trend charting is deferred to Milestone 3

All decisions are documented in `docs/decisions-log.md`.

## Testing

NoteFlow includes 114 automated tests written using Vitest across 6 test files.

### Weak Topic Detection Tests (5 tests)

`lib/weak-topics.test.ts` verifies the boundary conditions of the weak-topic classification logic.

A topic is considered weak only when:

- Accuracy is below 60%
- At least 3 attempts have been recorded

The tests specifically verify edge cases such as a topic with 0% accuracy but only two attempts, ensuring that isolated mistakes do not incorrectly classify a topic as weak. They also test the threshold boundary where exactly 60% accuracy is not considered weak, while values below 60% are.

### Recommendation Algorithm Tests (18 tests)

`lib/recommender.test.ts` verifies each recommendation component independently:

- `weaknessScore`
- `mistakeRecency`
- `recencyBoost`
- `difficultyMatch`

Additional tests verify composite recommendation scoring and the score-breakdown invariant.

The invariant test ensures that the value returned by `getScoreBreakdown` always sums to the same total score returned by `scoreQuestion`. This protects against future maintenance bugs where the scoring implementation and debugging view could otherwise drift apart.

The following shows the automated test run output (see Figure 4):

![Vitest test run](docs/images/vitest-run.png)
*Figure 4: Vitest test run*

### Systematic Test Design

The automated tests use two systematic test design techniques: equivalence partitioning and boundary value analysis. Equivalence partitioning groups inputs that should behave the same way, while boundary value analysis targets the exact threshold values where bugs commonly appear.

Three representative examples show how this was applied:

1. **Weak-topic detection** partitions topics by `{accuracy < 0.6, accuracy >= 0.6}` and `{attempts < 3, attempts >= 3}`. The boundary tests check exactly `0.6` accuracy and exactly `3` attempts, ensuring a topic is weak only when both conditions are satisfied.
2. **SM-2 review scheduling** partitions quality values into `{quality < 3}` failure and `{quality >= 3}` success, with a boundary test at exactly `3`. It also tests the ease-factor floor at exactly `1.3` and the three interval regimes: first successful repetition, second successful repetition, and third-or-later successful repetition.
3. **AI generation validation** partitions drafts into valid and invalid cases for each field. Boundary tests cover difficulty values `0`, `1`, `5`, and `6`, plus duplicate detection around the Jaccard threshold of `0.8`.

| Function | Partitions | Boundaries | Test file |
|---|---|---|---|
| `isWeakTopic` | `{accuracy < 0.6, >= 0.6}` x `{attempts < 3, >= 3}` | Exactly `0.6`, exactly `3` | `weak-topics.test.ts` (5 tests) |
| `scoreQuestion` / `getScoreBreakdown` | 4 independent term functions + composite score | Recency exactly 7 days (`>=` cutoff) | `recommender.test.ts` (18 tests) |
| `nextReviewState` | Quality `{< 3 fail, >= 3 pass}`; interval regimes repetition 1 / repetition 2 / repetition >= 3 | Quality exactly `3` as pass floor; ease exactly `1.3` as floor | `sm2.test.ts` (10 tests) |
| `wouldCreateCycle` / `blockedTopics` | Self-edge / chain / cycle; blocked vs unattempted prerequisite | Accuracy exactly `0.6`; attempts exactly `3` | `prereq.test.ts` (12 tests) |
| `isValidDraft` / `isDuplicate` / `clampCount` | Valid/invalid per field; type allow-list | Difficulty `0` / `1` / `5` / `6`; Jaccard exactly `0.8`; count exactly `1` / `8` | `generated-questions.test.ts` (56 tests) |
| `stepSimulation` / `graphBounds` | Coincident nodes; pinned vs free nodes | Settling threshold below `0.05` movement | `graph-layout.test.ts` (13 tests) |

These 6 files - designed with equivalence partitioning and boundary value analysis, as described above - contain 114 tests. Two more files (`shuffle.test.ts`, 6 tests; `seed-data.test.ts`, 4 tests) were added during M3 as straightforward regression guards rather than partition/boundary-style tests, bringing the full suite to 124 tests across 8 files.

### Manual System Testing

In addition to automated unit tests, the team conducted manual system testing covering the full user journey. Test cases include CRUD operations for all entity types, the complete quiz flow from start through results, edge cases such as topics with no attempts and modules with no topics, and dashboard accuracy and recommendation display under various attempt histories.

## User Testing

### Participants

Two NUS students participated in asynchronous remote testing sessions. Each session took approximately 15 to 20 minutes to complete.

### Method

Testers were given a shared task sheet, the NoteFlow User Testing Form, containing 7 structured tasks and 4 open-ended feedback questions. No facilitator was present; testers worked through the form independently using the live deployment at https://noteflow-liart.vercel.app and created real accounts as part of the flow.

### Findings

- **Core flow works end-to-end:** Both testers completed all 7 tasks. Signup, module creation, topic creation, note creation, quiz attempts, and dashboard review all worked without testers getting stuck.
- **File attachment UI needs clearer affordance:** Tester 1 flagged the file addition UI in the note form, suggesting that the interface could be made clearer with a more obvious button.
- **Post-answer explanation expected:** Tester 1 expected to see a model answer or explanation after submitting a quiz answer, especially for MCQ questions, rather than only seeing whether the answer was correct.
- **Navigation affordance was not immediately obvious:** Tester 2 noted the visual inconsistency between the boxed red Delete button and the unboxed Edit link, suggesting that the interactive hierarchy was not immediately clear.
- **Positive reception of the core concept:** Tester 1 liked the simplicity of the design and felt it would be a good way to organise notes. Both testers completed the quiz flow without difficulty.

### Changes Made

To address the navigation feedback, we added a chevron (`›`) and hover colour to topic, note, subtopic, and question cards so clickable cards are easier to recognise. The file upload interface was built in Milestone 3 on top of the existing Supabase Storage schema and verified working end-to-end in manual QA. The request for post-answer model answer display is still open and has not been built as of this documentation pass.

### Milestone 3 User Testing

#### Participants

Five students (NUS, NTU, secondary and NUS-grad) participated in asynchronous remote testing. 

#### Method

Testers used the same shared task-sheet format as Milestone 2, the NoteFlow "Try it yourself" document, with 8 structured tasks plus a 10-item usability Likert scale and 5 open-ended closing questions. Testers created their own account for Tasks 1-2, then loaded sample data or used the demo login for Tasks 3 onward, per the sheet's instructions, working independently against the live deployment.

#### Findings

- **AI question generation failed outright for multiple testers, not just underperformed:** Tester 3 tried "Generate questions" repeatedly with different notes, including AI-drafted content pasted in as a workaround, without success ("the AI is just not working... Please send help"). Tester 5's generation attempt also failed on a topic where they had uploaded a past-year exam paper as source material. Tester 4 separately found the feature "not intuitive" and said it isn't something they'd use, which is a discoverability complaint rather than a functional one.
- **Review queue behaviour was inconsistent across testers:** Testers 1 and 2 found nothing due in the review tab and were prompted to take more quizzes instead. Tester 4 could see a "due for review" count on the dashboard but couldn't interact with it and didn't recognise the term "review cards." Tester 5 expected review to surface a summary of learning progress or a study flow, and didn't find one.
- **No feedback on correctness after grading a review card:** Tester 3 said NoteFlow never confirmed whether their recall was right or wrong after answering a card, and suggested revealing the correct answer or showing a session-end score.
- **Recommendation and weak-topic signals were easy to overlook:** Tester 3 took 7 minutes to notice the "Recommended next" text on the dashboard. Tester 4 found the "weak topics" heading at the top of the dashboard but couldn't interact with it, and only noticed the actual weak-topics list further down the page after a while.
- **No persistent navigation or location indicator:** Tester 4 said there was no sidebar showing where they were in the module/topic/note hierarchy and that switching between notes was hard; in the closing questions, they named "adding the sidebar" as the one change that would get them to actually use NoteFlow during a real semester. Tester 5 similarly couldn't spot the menu bar at first glance when trying to create a module.
- **Adding notes inside a topic wasn't discoverable:** Tester 3 created a module and topic without difficulty but didn't realise a topic card could be clicked into to add notes, since the card only exposed Edit and Delete buttons; they suggested an additional visual cue.
- **Concept graph / prerequisite UI was unclear:** Tester 3 had to switch to the demo account before finding an existing prerequisite link, and found the gray instructional text hard to notice. Tester 5 could not complete this task at all, reporting low confidence, and said clicking failed to clear an existing dependency.
- **Static quiz and MCQ ordering:** Tester 3 asked for randomised question order and randomised MCQ answer-option order, noting that with a fixed order, repeated practice risks testers "remembering the ABCs" rather than actually learning the material.
- **Usability scale responses (2 of 5 testers) were mixed to negative:** Tester 4 rated NoteFlow 2/5 on "easy to use" and "would use frequently," and 4/5 on "unnecessarily complex" and "needed to learn a lot before getting going." Tester 5's scores were more positive — 4/5 on "easy to use" and "felt confident using it" — but still rated "unnecessarily complex" 2/5. The other three testers left the scale blank.
- **Positive signal from one tester on the core dashboard concept:** Tester 3 said seeing weak topics surfaced on the dashboard let them focus there before moving to other topics, and described the overall experience as "pretty good... has potential to be very useful to students."

#### Changes Made

The empty review queue Testers 1 and 2 hit was a data problem, not a code bug: the demo account's `review_schedule` table was empty, so `/review` always showed "all caught up" with nothing due regardless of what a tester had just quizzed on. `scripts/seed-demo.ts` now seeds due review-schedule rows into the demo account (commit `176afa7`), and the account resets to that same seeded state on every logout via `resetDemoAccount()`, so a tester using the demo login always has real cards due. Confirmed fixed.

The AI generation failures Testers 3 and 5 hit turned out to have the same root cause, traced directly rather than guessed at: `generateQuestionDrafts()` only counts a note as usable if its `content` field has real text, and a note created by uploading a file (Tester 5's PDF) has `content` left empty, since the app has no PDF-to-text extraction step. Auditing the seed data behind "Load sample data" and the demo account found the same gap independent of any upload - exactly half the seeded topics in every module had zero notes at all, so generation would have failed identically for Tester 3 on those topics regardless of Gemini. Fixed for the demo/testing path: every previously note-less topic in `lib/seed-data.ts` and `lib/seed-demo-data.ts` now has a real markdown note, locked in by a new test (`lib/seed-data.test.ts`) asserting every seeded topic has usable content. Future work: a real user who only uploads files without typing any notes will still hit this, since there's no PDF text-extraction feature - tracked in `docs/m3-ui-fixes-plan.md`.

The remaining findings were addressed directly in code. The module page's topic list now has the same chevron and hover-underline treatment already used elsewhere, fixing the note-creation discoverability gap. The dashboard's duplicate "Weak topics" labeling was resolved by renaming the non-interactive KPI stat to "Weak," and "Recommended next" was given more visual weight so it reads as a heading. Quiz questions and MCQ answer options are now shuffled on every attempt (`lib/shuffle.ts`, with its own test coverage), addressing the "remembering the ABCs" concern. Review's multiple-choice cards now show right/wrong feedback and the correct answer before advancing, and the session-end screen shows a real score instead of just a count. The concept graph's prerequisite-removal control is now a persistent, always-visible marker on every connector line instead of a hover-only hit target. Breadcrumbs now extend to the note (and its subtopic, if any) instead of stopping at the topic.

A full persistent sidebar - the specific "one change" Tester 4 said would make them actually use NoteFlow - has also been built (`components/Sidebar.tsx`, `components/SidebarNav.tsx`), not just scoped. It renders a module → topic → subtopic → note tree on every page once logged in, auto-expands whatever branch the current page is in, and highlights the active module/topic/note, so switching between notes no longer requires navigating back through the topic page. It's desktop-only (`hidden lg:block`) for this pass - a mobile version (collapsible drawer, hamburger toggle) was not attempted and would need its own design pass.

## Screenshots

The deployed application is available at https://noteflow-liart.vercel.app. The screenshots below show the authentication flow from the initial proof of concept deployment (see Figures 5–8).

### Signup
![Signup](docs/images/poc-signup.png)
*Figure 5: Signup*

### Login
![Login](docs/images/poc-login.png)
*Figure 6: Login*

### Dashboard
![Dashboard](docs/images/poc-dashboard.png)
*Figure 7: Dashboard*

### Logout
![After logout](docs/images/poc-logout.png)
*Figure 8: Logging out redirects the user back to the login page.*

These screenshots demonstrate the authentication flow, session persistence across browser refreshes, and protected route redirection via middleware.

### M2 — Core features

**Modules list**

The module list is the default landing view after login, showing every module the student has created (see Figure 9).

![Modules list](docs/images/m2-modules-list.png)
*Figure 9: Modules list*

**Module detail — topics**

Selecting a module opens its topic list, shown in Figure 10.

![Module detail](docs/images/m2-topic-detail.png)
*Figure 10: Module detail*

**Topic detail — subtopics, notes, and questions**

A topic page surfaces its subtopics, notes, and questions together, as shown in Figure 11.

![Topic detail](docs/images/m2-subtopic.png)
*Figure 11: Topic detail*

**Quiz — answering a question**

Figure 12 shows the quiz-taking flow while a question is being answered.

![Quiz answer](docs/images/m2-quiz-answer.png)
*Figure 12: Quiz answer*

**Quiz — results**

After submission, results are shown immediately, as in Figure 13.

![Quiz results](docs/images/m2-quiz-results.png)
*Figure 13: Quiz results*

**Dashboard — weak topics, accuracy, and recommendation**

The dashboard (Figure 14) surfaces weak-topic flags, per-topic accuracy, and the current recommendation.

![Dashboard](docs/images/m2-dashboard.png)
*Figure 14: Dashboard*

**Logo — enlarge on click**

Clicking the NoteFlow logo in the nav bar opens it full-screen in a modal (Figure 15),
implemented in `components/Zoom.tsx`. This shipped in M2 but was never captured in the README until now.

![Logo enlarged in modal](docs/images/m2-logo-zoom.png)
*Figure 15: Logo click-to-enlarge modal*

### M3 — New features

**Concept graph — prerequisite mapping and weak-prerequisite gating**

The concept graph (Figure 16) shows prerequisite edges between topics. Node colour reflects
accuracy (green = mastered, red = needs practice), and a dashed ring marks a topic gated
behind a weak prerequisite — Streams here is fully answered (100%) but still shown as gated
because its prerequisite, Recursion, is currently a weak topic (40%).

![Concept graph](docs/images/m3-graph.png)
*Figure 16: Concept graph, showing Streams gated behind weak-prerequisite Recursion*

**Modules list — for reference**

The modules list (Figure 17) is unchanged in layout since M2 (Figure 9); included here
alongside the module and topic updates below for a complete picture of the M3 demo account,
now with four modules instead of the M2 demo's original set - CS2030S, MA1521, and ST2334
as before, plus GEA1000 (added after M3 testing surfaced that it was only in the separate
"Load sample data" flow, not the demo login itself). Figure 17 predates the GEA1000 addition
and hasn't been re-captured.

![Modules list](docs/images/m3-modules-list.png)
*Figure 17: Modules list*

**Module detail — concept graph entry point**

The module detail page (Figure 18) gained a "Concept graph" button in M3, linking to the view above.

![Module detail with Concept graph button](docs/images/m3-module-detail.png)
*Figure 18: Module detail, now with a Concept graph button*

**Topic detail — AI generation entry point**

The topic detail page (Figure 19) gained a "Generate questions" link in M3, next to the
existing "+ New question" link.

![Topic detail with Generate questions link](docs/images/m3-topic-detail.png)
*Figure 19: Topic detail, now with a Generate questions link*

**Spaced repetition — review queue**

The review queue (Figure 20) surfaces due cards from the SM-2 scheduler, one at a time, with
a running count of how many remain in the session. Following M3 user testing, MCQ cards now
show right/wrong feedback and the correct answer before advancing to the next card (previously
they graded and advanced instantly with no visible outcome), and the session-end screen shows
a real score ("N of M correct") instead of just a count reviewed - see Changes Made under
[User Testing](#user-testing). Figure 20 below predates that change; not yet re-captured.

![Spaced repetition review](docs/images/m3-review.png)
*Figure 20: Spaced repetition review queue*

**AI question generation — configuration**

Before generating, the user picks a count (1-8) and question types (Figure 21). Long-answer
questions are excluded from AI generation because they can't be auto-graded reliably.

![AI question generation config](docs/images/m3-ai-generation-config.png)
*Figure 21: AI question generation, configuration step*

**AI question generation — draft and review**

Generated questions are shown in an editable draft-and-review screen before anything is
saved — nothing is written to the question bank until the user explicitly accepts a draft.
Figures 22-24 show all five questions generated from one call, scrolled in sequence.

![AI-generated drafts, part 1](docs/images/m3-ai-generation-draft-1.png)
*Figure 22: AI-generated question drafts (1 of 3) — short answer and MCQ*

![AI-generated drafts, part 2](docs/images/m3-ai-generation-draft-2.png)
*Figure 23: AI-generated question drafts (2 of 3) — two more MCQs*

![AI-generated drafts, part 3](docs/images/m3-ai-generation-draft-3.png)
*Figure 24: AI-generated question drafts (3 of 3), with the "Accept & save 5 questions" action still unclicked*

**Dashboard — spaced repetition and mastery tiers**

M3 added two elements to the M2 dashboard (Figure 14): a "Due for review" count sourced from
`review_schedule`, and a three-tier "Mastery breakdown" (weak/improving/strong) computed by
`components/mastery-dot.tsx`. Figure 25 shows both alongside the M2-era weak-topics and
accuracy sections.

![Dashboard with mastery breakdown and due-for-review](docs/images/m3-dashboard.png)
*Figure 25: Dashboard, with M3's mastery breakdown and due-for-review count*

**Light and dark theme — toggle in the nav bar**

The nav bar toggle (`components/theme-toggle.tsx`) switches between light and dark themes,
defaulting to the browser's system preference and persisting the choice across sessions.
Figure 26 shows the dashboard in dark mode; every other figure in this README was captured
in light mode.

![Dashboard in dark mode](docs/images/m3-theme-toggle.png)
*Figure 26: Dashboard with dark mode enabled via the nav bar toggle*

## Setup Instructions
- Credentials: demo@noteflow.app (password: noteflow)
- Fresh sign-up also works — any new account can self-seed, no shared login required
- If an account is empty, click "Or load sample data to explore first" on the
  Modules page (/modules) — instantly adds CS2030S and GEA1000, ~20 questions,
  3 weeks of quiz history
- What to look at first: dashboard weak-topic flags (Recursion in CS2030S,
  Data Visualization Fallacies in GEA1000) -> recommendation card -> score breakdown
- GEA1000 exists specifically so non-CS evaluators/students have a module that
  isn't a programming course

### Prerequisites
- Node.js 22+ (install via nvm)
- A Supabase account

### Installation

1. Clone the repository:
```bash
   git clone git@github.com:enosher/noteflow.git
   cd noteflow
```

2. Install dependencies:
```bash
   npm install
```

3. Create `.env.local` at the project root:
```
NEXT_PUBLIC_SUPABASE_URL=your-own-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-own-anon-key
```

4. Run the automated unit tests to verify the setup:
```bash
   npx vitest run
```

All 124 tests should pass.

5. Run the development server:
```bash
   npm run dev
```

6. Open http://localhost:3000

## Known Limitations

- Email confirmation is disabled in Supabase for development simplicity.
- No password reset flow has been implemented.
- Common Postgres error cases are now translated through `friendlyMessage()` and unexpected failures are caught by `app/error.tsx`, but less common error paths may still need more user-friendly, page-specific copy.
- No rate limiting is currently applied to authentication endpoints.
- Concept graph prerequisites are limited to topics within the same module. Cross-module prerequisite edges are recognised as useful but deferred.
- Generated-question quality depends heavily on the completeness and clarity of the user's notes, and there is no fallback source of trusted course content if notes are thin. More precisely (found during M3 user testing, see [User Testing](#user-testing)): a note created by uploading a file only, with no typed or pasted text, contributes zero content to generation - there is no PDF/file text-extraction step, so the topic looks note-less even with a file attached. See [Future Work](#future-work).
- `long_answer` questions are still auto-marked correct in the quiz flow. AI generation excludes them, but manually created long-answer questions can still inflate accuracy statistics.
- The app UI still needs a clear disclosure that the shared free-tier Gemini setup may allow Google to train on submitted study notes and generated outputs.
- The shared AI-generation cap of 40 calls per 24 hours is enforced server-side, but there is no UI indicator showing remaining quota. A capped user currently sees only a generic failure message.

## Future Work

- **PDF / file text extraction for AI question generation.** Uncovered during M3 user testing (see [User Testing](#user-testing) and the Known Limitations note above): a note created by uploading a file, with no typed or pasted text alongside it, never contributes content to `generateQuestionDrafts()`, since there is no text-extraction step for uploads. A real user who only uploads PDFs will hit "no usable note content" the same way an M3 tester did. Two options were scoped in `docs/m3-ui-fixes-plan.md` but not built for M3: add a server-side PDF-to-text extraction step (e.g. `pdf-parse`) so an uploaded file also populates `content`, which is real work given parsing quality varies and a serverless function has time/memory limits; or leave file-only notes unsupported for generation but say so explicitly next to the file upload field in the note UI, not just in this README. Given the M3 deadline, this was deprioritised in favour of fixing the demo/testing-facing version of the same gap (see Changes Made under Milestone 3 User Testing).

## Acknowledgements

- Adviser: Rajakumar Niranjana
- NUS Orbital 2026 organising team
