# NoteFlow

![Apollo 11](https://img.shields.io/badge/Orbital-Apollo%2011-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black)

A web app that helps university students organise study materials by topic, track quiz performance, and get adaptive practice recommendations that target their weak areas.

**Live demo:** https://noteflow-liart.vercel.app

## Table of Contents

- [Motivation](#motivation)
- [Aim](#aim)
- [User Stories](#user-stories)
- [Features](#features)
- [Planned for Milestone 3](#planned-for-milestone-3)
- [System Design](#system-design)
- [Recommendation Algorithm](#recommendation-algorithm)
- [Implementation Challenges](#implementation-challenges)
- [Why NoteFlow Instead of ChatGPT](#why-noteflow-instead-of-chatgpt)
- [Tech Stack](#tech-stack)
- [Development Plan](#development-plan)
- [Software Engineering Practices](#software-engineering-practices)
- [Project Management](#project-management)
- [Testing](#testing)
- [User Testing](#user-testing)
- [Screenshots](#screenshots)
- [Setup Instructions](#setup-instructions)
- [Known Limitations](#known-limitations)

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
3. Automatically identifies weak topics based on a student's quiz history
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
- Store notes under relevant topics and subtopics
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

## Planned for Milestone 3

### AI Question Generation

- Generate additional practice questions from existing notes
- Allow students to request more questions for specific weak topics

### Spaced Repetition Review

- Implement SM-2 scheduling for long-term retention
- Surface questions and notes based on review intervals

### Concept Graph and Prerequisite Mapping

- Visualise relationships between topics
- Highlight prerequisite concepts before advanced topics are attempted

## System Design

### Architecture

![Architecture Diagram](docs/images/architecture.svg)

NoteFlow uses a full-stack Next.js architecture with Supabase as the database and authentication layer.

- **Frontend:** Next.js App Router with React Server Components and Tailwind CSS, deployed on Vercel
- **Server-side application logic:** Next.js Server Components for data fetching and Server Actions for mutations
- **Database and auth:** Supabase (PostgreSQL) for data storage, with Supabase Auth for authentication

Milestone 2 expanded the architecture from an authentication prototype into a data-driven study application. Server Actions now form the mutation boundary for module, topic, subtopic, note, question, and quiz workflows; Supabase RLS policies scope user data to `auth.uid()`; and Supabase Storage is configured for file attachment support.

### Page Flow

![Page Flow](docs/images/page-flow.svg)

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

![ER Diagram](docs/images/er-diagram.svg)

The database schema is fully implemented and deployed on Supabase. All application tables are protected using Row Level Security (RLS) policies scoped to `auth.uid()`, ensuring users can only access their own data.

Child tables do not carry a `user_id` column directly; ownership is enforced by joining up the hierarchy to `modules.user_id`. This keeps the schema normalised and avoids update anomalies at the cost of slightly more complex RLS policy definitions.

The main tables are:

**profiles** - extends Supabase auth.users
- `id` (UUID, primary key, references auth.users)
- `display_name` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**modules** - academic unit (e.g. CS2030)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key -> profiles)
- `code` (text, e.g. "CS2030")
- `name` (text, e.g. "Programming Methodology II")
- `description` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**topics** - within a module
- `id` (UUID, primary key)
- `module_id` (UUID, foreign key -> modules)
- `name` (text)
- `description` (text, nullable)
- `order_index` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**subtopics** - within a topic
- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key -> topics)
- `name` (text)
- `order_index` (integer)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**notes**
- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key -> topics, nullable)
- `subtopic_id` (UUID, foreign key -> subtopics, nullable)
- `title` (text)
- `content` (text, markdown, nullable)
- `file_url` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Notes must be attached to exactly one parent - either a topic or a subtopic, never both and never neither. This is enforced by a check constraint (`notes_exactly_one_parent`).

**questions**
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

**quiz_attempts**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key -> profiles)
- `question_id` (UUID, foreign key -> questions)
- `user_answer` (text, nullable)
- `is_correct` (boolean)
- `time_taken_ms` (integer, nullable)
- `attempted_at` (timestamp)

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

### Milestone 3 (30 June - 27 July) - Planned

| Week | Dates | Focus |
|---|---|---|
| Week 1 | 30 Jun - 6 Jul | AI question generation design and spaced repetition planning |
| Week 2 | 7-13 Jul | Concept graph and prerequisite mapping |
| Week 3 | 14-20 Jul | User testing with NUS students and iteration based on feedback |
| Week 4 | 21-27 Jul | Final documentation, performance optimisation, and submission prep |

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
- **File upload UI** — deferred; the database schema and Supabase Storage bucket are configured, but the upload interface was cut to keep Milestone 2 focused on the quiz and recommendation workflows
- **FSRS scheduling algorithm** — replaced with a weighted scoring model for the reasons described in the Recommendation Algorithm section
- **Content types (important links and formula summaries)** — listed as planned content types per topic in the Milestone 1 README; not implemented in Milestone 2 and deferred pending demand from user testing
- **Dashboard accuracy trends and strong topic highlighting** — the Milestone 1 plan described showing accuracy trends over time and explicitly highlighting strong topics; the current dashboard shows current per-topic accuracy but historical trend charting is deferred to Milestone 3

All decisions are documented in `docs/decisions-log.md`.

## Testing

NoteFlow includes 19 automated unit tests written using Vitest.

### Weak Topic Detection Tests (5 tests)

`lib/weak-topics.test.ts` verifies the boundary conditions of the weak-topic classification logic.

A topic is considered weak only when:

- Accuracy is below 60%
- At least 3 attempts have been recorded

The tests specifically verify edge cases such as a topic with 0% accuracy but only two attempts, ensuring that isolated mistakes do not incorrectly classify a topic as weak. They also test the threshold boundary where exactly 60% accuracy is not considered weak, while values below 60% are.

### Recommendation Algorithm Tests (14 tests)

`lib/recommender.test.ts` verifies each recommendation component independently:

- `weaknessScore`
- `mistakeRecency`
- `recencyBoost`
- `difficultyMatch`

Additional tests verify composite recommendation scoring and the score-breakdown invariant.

The invariant test ensures that the value returned by `getScoreBreakdown` always sums to the same total score returned by `scoreQuestion`. This protects against future maintenance bugs where the scoring implementation and debugging view could otherwise drift apart.

The following shows the automated test run output:

![Vitest test run](docs/images/vitest-run.png)

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

To address the navigation feedback, we added a chevron (`›`) and hover colour to topic, note, subtopic, and question cards so clickable cards are easier to recognise. The request for post-answer model answer display has been noted for Milestone 3, and the file upload interface will also be improved in Milestone 3 once the upload UI is built on top of the existing Supabase Storage schema.

## Screenshots

The deployed application is available at https://noteflow-liart.vercel.app. The screenshots below show the authentication flow from the initial proof of concept deployment.

### Signup
![Signup](docs/images/poc-signup.png)

### Login
![Login](docs/images/poc-login.png)

### Dashboard
![Dashboard](docs/images/poc-dashboard.png)

### Logout
![After logout](docs/images/poc-logout.png)
*Logging out redirects the user back to the login page.*

These screenshots demonstrate the authentication flow, session persistence across browser refreshes, and protected route redirection via middleware.

### M2 — Core features

**Modules list**
![Modules list](docs/images/m2-modules-list.png)

**Module detail — topics**
![Module detail](docs/images/m2-topic-detail.png)

**Topic detail — subtopics, notes, and questions**
![Topic detail](docs/images/m2-subtopic.png)

**Quiz — answering a question**
![Quiz answer](docs/images/m2-quiz-answer.png)

**Quiz — results**
![Quiz results](docs/images/m2-quiz-results.png)

**Dashboard — weak topics, accuracy, and recommendation**
![Dashboard](docs/images/m2-dashboard.png)

## Setup Instructions

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

All 19 tests should pass.

5. Run the development server:
```bash
   npm run dev
```

6. Open http://localhost:3000

## Known Limitations

- The database schema includes a `file_url` field and Supabase Storage integration, but a file upload user interface has not yet been implemented.
- Email confirmation is disabled in Supabase for development simplicity.
- No password reset flow has been implemented.
- Some Supabase error messages are still displayed directly without user-friendly formatting.
- No rate limiting is currently applied to authentication endpoints.

## Acknowledgements

- Adviser: Rajakumar Niranjana
- NUS Orbital 2026 organising team
