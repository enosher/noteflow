# NoteFlow Project Log

NUS Orbital 2026 · Apollo 11 · Team NoteFlow

Each row records work done on the project. Log every hour, including self-learning, setup, debugging, and documentation.

---

## Liftoff (9 May - 18 May 2026)

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-05-09 | Read Orbital programme overview; chose React Native + Expo stack; installed Node 22, Git, VS Code         | 3.0   |
| 2026-05-12 | Re-read Apollo 11 requirements; decided to switch from React Native to Next.js; researched the differences between the two | 2.0   |
| 2026-05-13 | Created Supabase project in Singapore region; turned on Data API and RLS; turned off email confirmation for development | 1.5   |
| 2026-05-14 | Designed Liftoff poster in Canva; tried 4 different templates; finalised layout with all 6 sections and tech stack logos | 2.0   |
| 2026-05-16 | Revised poster based on adviser feedback; added team names and Project ID; elaborated on feature descriptions | 0.5   |
| 2026-05-16 | Attended Mission Control #1 - Database: Relational Databases workshop (Zoom, 2 hours)                     | 2.0   |
| 2026-05-18 | Reviewed final poster and video files; uploaded to Google Drive; checked links in incognito window; submitted to Skylab | 0.5   |
| **Total**  |                                                                                                           | **11.5** |

### Spencer Ting

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-05-09 | Read Orbital programme overview; set up initial React Native and Expo environment                         | 3.0   |
| 2026-05-12 | Re-read Apollo 11 requirements; discussed and agreed on switching tech stack to Next.js                   | 2.0   |
| 2026-05-16 | Built Liftoff video slides in Canva (5 slides); rebuilt slides manually after AI-generated draft was rejected under Orbital policy | 1.5   |
| 2026-05-16 | Attended Mission Control #1 - Database: Relational Databases workshop (Zoom, 2 hours)                     | 2.0   |
| 2026-05-17 | Recorded voiceover for video; edited in CapCut - trimmed silences, added subtitles, synced audio to slides, exported MP4 | 1.5   |
| 2026-05-18 | Final review with Enosh; checked file naming and Google Drive link permissions; submitted to Skylab       | 0.5   |
| **Total**  |                                                                                                           | **10.5** |

---

## Milestone 1 - Ideation (19 May - 1 June 2026)

### Spencer Ting

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-05-25 | Reviewed Orbital programme overview requirements for Milestone 1; planned week 2 task split with Enosh   | 1.0   |
| 2026-05-26 | Built signup page (app/signup/page.tsx) with email and password form; connected to Supabase auth signup; debugged merge conflict caused by overlapping work on the same branch; resolved conflict and opened PR | 5.0   |
| 2026-05-26 | Tested signup page on local machine; flagged UI issues and merge conflict to Enosh; reviewed PR on GitHub via Vercel preview URL | 1.0   |
| 2026-05-27 | Built auth middleware (middleware.ts) to protect routes - unauthenticated users are sent to login, logged-in users are redirected away from signup and login pages; updated root page to redirect based on login state; opened and merged PR | 4.0   |
| 2026-05-27 | Tested auth middleware locally; flagged redirect behaviour issues to Enosh; reviewed and approved dashboard PR on GitHub | 1.0   |
| 2026-05-28 | Reviewed README sections 8-15 written by Enosh; gave feedback on system design section and architecture diagram | 1.0   |
| 2026-05-29 | End-to-end testing of full auth flow on live Vercel URL (signup, login, dashboard, logout, session persistence, protected routes) | 1.0   |
| 2026-05-31 | Built and recorded Milestone 1 video (9 slides in Google Slides); wrote full voiceover script covering all features and live demo; assembled video in CapCut with auto-generated captions; exported as 7640.mp4 | 3.0   |
| **Total**  |                                                                                                           | **17.0** |

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-05-21 | Ran create-next-app to set up the Next.js project; debugged npm install hanging due to Clash VPN proxy; fixed wrong GitHub remote URL that had placeholder text instead of actual username; fixed rejected push using git pull rebase; pushed project to GitHub | 2.5   |
| 2026-05-22 | Created three Supabase client files (client.ts, server.ts, middleware.ts); created .env.local with Supabase keys; fixed Supabase packages that were installed in the wrong folder; debugged Vercel deployment being blocked due to a typo in git email address; added environment variables to Vercel dashboard; confirmed live URL was working | 3.0   |
| 2026-05-23 | Completed Next.js Learn course chapters 1-2; debugged pnpm approve-builds prompt that was accidentally declined; fixed stray closing div tag in page.tsx | 2.0   |
| 2026-05-25 | Reviewed Orbital programme overview requirements for Milestone 1; planned week 2 task split with Spencer; set up branch protection ruleset fix on GitHub | 1.0   |
| 2026-05-26 | Cloned repo on local machine; created .env.local with Supabase keys; ran npm install; confirmed project running at localhost:3000; opened first PR adding name to README | 2.0   |
| 2026-05-26 | Built login page (app/login/page.tsx) with email and password form connected to Supabase sign in; debugged email not confirmed error by turning off email confirmation in Supabase dashboard; tested login flow with a real account | 4.0   |
| 2026-05-27 | Built dashboard page (app/dashboard/page.tsx) showing the logged-in user's email address; built logout button (logout-button.tsx) as a separate client component; pulled Spencer's merged middleware to get route protection working; tested the full flow - signup, login, dashboard, logout; opened and merged PR | 4.0   |
| 2026-05-28 | Wrote README sections 8-15 covering system design, tech stack, development plan, software engineering practices, proof of concept screenshots, setup instructions, known limitations, and acknowledgements; drew architecture and page flow diagrams in Excalidraw; took screenshots of all four POC screens; pushed directly to main by mistake | 4.0   |
| 2026-05-29 | Wrote README sections 1-7 content covering motivation, aim, user stories, core features, extension features | 1.5   |
| 2026-05-29 | Updated Milestone 1 poster in Canva based on adviser feedback to make it more professional; added POC screenshots using device mockups, added architecture diagram and page flow section; went through 3 rounds of revisions | 3.0   |
| 2026-05-30 | Built Milestone 1 video slides in Google Slides (9 slides total); matched color scheme to poster; added mock performance table on Track slide, mock recommendation list on Adapt slide, mock dashboard image on POC slide | 3.0   |
| **Total**  |                                                                                                           | **30.0** |

---

## Milestone 2 - Prototype (2 June - 29 June 2026)

### Spencer Ting

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-06-02 | Reviewed M1 TA and peer feedback; planned M2 task allocation with Enosh; reviewed M2 schema SQL and new TypeScript types | 2.0 |
| 2026-06-03 | Completed Next.js Learn chapters 3–5: layouts, pages, fonts, images | 3.0 |
| 2026-06-04 | Completed Next.js Learn chapters 6–9: databases, data fetching, static and dynamic rendering | 3.5 |
| 2026-06-05 | Completed Next.js Learn chapters 10–13: streaming, search, pagination | 3.5 |
| 2026-06-06 | Completed Next.js Learn chapters 14–16: mutations, error handling, accessibility, authentication | 3.5 |
| 2026-06-07 | Sketched wireframes for all M2 pages in Excalidraw; reviewed Enosh's scaffold pages and patterns guide; agreed on URL structure | 2.5 |
| 2026-06-09 | Reviewed Enosh's Pattern A and Pattern B scaffold pages and SPENCER_GUIDE.md; set up local dev with updated schema and seed data; tested modules list page with seed data | 2.5 |
| 2026-06-10 | Studied TypeScript types and server action patterns in codebase; traced through createModule and updateModule actions; read through Supabase query patterns | 2.5 |
| 2026-06-13 | Reviewed schema changes and RLS policies in Supabase dashboard; studied nested URL structure for module → topic → subtopic hierarchy | 2.0 |
| 2026-06-14 | Planned UI component hierarchy for all M2 pages; drafted module, topic, subtopic, notes, and questions page layouts | 2.0 |
| 2026-06-16 | Reviewed and merged Enosh's storage-setup, subtopics-actions, gitignore, and modules-edit-delete PRs; tested module CRUD flow on Vercel preview URL | 1.5 |
| 2026-06-17 | Built read-only module detail page (app/modules/[id]/page.tsx) showing topics list for a given module; PR #17 | 2.0 |
| 2026-06-17 | Built module edit form and delete button UI following Enosh's Pattern B; wired to updateModule and deleteModule server actions; PR #18 | 1.5 |
| 2026-06-17 | Built topics list and create-topic form pages within module detail; connected to topic server actions; PR #19 | 1.5 |
| 2026-06-18 | Reviewed and merged Enosh's topics-actions, schema-docs, questions-actions, quiz-flow, navbar, and notes-storage PRs; tested on Vercel preview URLs | 2.5 |
| 2026-06-19 | Reviewed and merged Enosh's notes-actions and project-log update PRs | 1.0 |
| 2026-06-21 | Built notes list, note detail, create-note and edit-note pages with markdown textarea, rendered preview, and file upload display; PR #34 | 3.0 |
| 2026-06-21 | Built questions list page and create-question form with MCQ option fields and difficulty selector; PR #35 | 2.0 |
| 2026-06-22 | Built dashboard UI: weak topics panel, per-topic accuracy table, and recommendation card showing top recommended question with score-breakdown debug view | 5.5 |
| 2026-06-23 | Executed manual system testing; documented 25+ test cases with screenshots in docs/manual-test-log.md | 6.0 |
| 2026-06-27 | Took M2 screenshots of all core feature pages (modules list, module detail, topic detail, quiz answer, quiz results, dashboard); committed 6 screenshots to docs/images/ | 1.0 |
| **Total**  |                                                                                                           | **54.5** |

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-06-08 | Reviewed and graded peer teams' Milestone 1 proof of concepts against the rubrics; reviewed TA and peer feedback received on NoteFlow; ideated implementation changes in response | 2.0 |
| 2026-06-08 | Ran M2 schema migration in Supabase SQL editor; created all 7 tables, RLS policies, triggers, cascade deletes; debugged idempotency issues; verified auth trigger creates profile rows on signup | 2.5 |
| 2026-06-08 | Generated TypeScript types from Supabase; wired `Database` type into Supabase clients; debugged working directory and keychain issues; committed and opened PR on `chore/db-types` | 1.5 |
| 2026-06-08 | Review and synthesised peer-review and TA feedback | 1.5 |
| 2026-06-08 | Ideated week-by-week task breakdown, mandatory vs optional deliverables, role split | 1.5 |
| 2026-06-09 | Built modules list page (Pattern A reference page); RLS-scoped fetch, empty state, error handling | 3.0 |
| 2026-06-09 | Built create module form (Pattern B); server action with validation, Supabase insert, redirect; debugged a stray folder and a dropped git push | 3.0 |
| 2026-06-09 | Debugged seed data script — null user_id error traced to a missing profiles row from signing up before the handle_new_user trigger existed; fixed with manual insert; saved cleaned script to `docs/seed-data.sql` | 1.5 |
| 2026-06-09 | Worked out a file ownership matrix to prevent merge conflicts | 0.5 |
| 2026-06-15 | Module edit + delete server actions | 2.5 |
| 2026-06-15 | Topic create/edit/delete server actions following the `.bind` nested-resource pattern | 2.0 |
| 2026-06-15 | Debugged stray untracked `supabase/.temp` cache folder; added to `.gitignore` | 0.5 |
| 2026-06-15 | Added M2 schema migration to the repo for the first time | 0.5 |
| 2026-06-15 | Debugged branch/commit mix-up from working on the wrong branch; fixed a filename typo; re-pushed affected PRs | 0.5 |
| 2026-06-16 | Built Supabase Storage setup — private `note-files` bucket, RLS policies, `lib/storage.ts` helper; smoke-tested upload via Supabase dashboard | 3.0 |
| 2026-06-16 | Subtopic create/edit/delete server actions following Pattern C; commit `847bed9` on `feat/subtopics-actions` | 3.0 |
| 2026-06-16 | Debugged a branch/commit mix-up — storage work had landed on the subtopics branch with stray files; cleaned up and force-pushed a clean commit | 1.0 |
| 2026-06-17 | Merged main into `feat/storage-setup` and `feat/subtopics-actions`; reran lint and build | 2.5 |
| 2026-06-17 | Wrote `createQuestion` server action — MCQ option parsing, answer-matching validation, difficulty check; on `feat/questions-actions` | 3.5 |
| 2026-06-17 | Reviewed Spencer's PRs #17-#19; found and removed an unused, deprecated `@supabase/auth-helpers-nextjs` dependency that reappeared after a rebase; resolved a merge conflict on `app/modules/[id]/page.tsx`; confirmed PR #20 had zero new commits and closed it | 1.5 |
| 2026-06-18 | Built shared nav bar (NavBar, NavLinks, FlowMark, nav-items) so /modules is reachable from the dashboard; wired into app/layout.tsx; fixed LogoutButton import (was a default export, not named); removed duplicate LogoutButton from dashboard page; installed Homebrew and GitHub CLI for PR workflow | 3.0 |
| 2026-06-18 | Designed NoteFlow logo/icon — explored five initial concept directions in SVG; narrowed to two, then converged on a "Flowing Note" concept (page with folded corner, header lines, wave as horizon line, rising graph line with data dots, loop arrow); iterated colour from teal to cream | 4.0 |
| 2026-06-18 | Wrote getNoteLocation helper (lib/notes.ts) and notes create/edit/delete actions with file upload (lib/storage.ts integration) | 2.0 |
| 2026-06-18 | Quiz answer submission + attempt recording — submitAnswer server action (MCQ/short-answer case-insensitive match, long_answer always marked correct) | 2.0 |
| 2026-06-18 | Created `docs/decisions-log.md` to record major decisions across Liftoff, M1 and M2 (stack switch, Apollo 11 scope, schema choices, storage conventions, scaffold patterns, quiz grading, weak-topic thresholds, recommender weights) | 3.0 |
| 2026-06-19 | Built markdown paste import page (`app/modules/[id]/topics/[topicId]/notes/import/page.tsx`), reusing `createNote.bind(null, topicId, null)` | 2.0 |
| 2026-06-19 | Implemented finalised NoteFlow logo into the nav bar | 1.0 |
| 2026-06-19 | Updated `docs/decisions-log.md` with schema, scaffold pattern, quiz grading, weak-topic threshold, and recommender weight decisions | 1.5 |
| 2026-06-20 | Built `lib/weak-topics.ts` — `getTopicAccuracy`, `isWeakTopic`, with modifiable `WEAK_TOPIC_THRESHOLD` / `WEAK_TOPIC_MIN_ATTEMPTS` | 3.0 |
| 2026-06-20 | Built `lib/recommender.ts` — weighted-sum `getRecommendedQuestion` scoring algorithm using info from `lib/weak-topics` | 1.0 |
| 2026-06-20 | Added zoom feature for users to admire the logo; fixed logo dimensions, logo flap colour, and the Zoom background contrast across three follow-up commits | 2.0 |
| 2026-06-21 | Wrote Vitest unit tests for `lib/weak-topics.ts` and `lib/recommender.ts` (16 tests incl edge cases); fixed a Supabase nested-relation cast in `lib/recommender.ts` to match the established subtopics pattern | 2.5 |
| 2026-06-21 | Built quiz-taking UI (start screen, questions, results) | 2.0 |
| 2026-06-21 | Fixed a missing pending state on the note save button — prevents a silent hang and double-submit | 1.0 |
| 2026-06-21 | Built the score-breakdown view to explain the recommendations — shows the weighted sub-scores (topic weakness, recency boost, mistake recency, difficulty match) behind each recommended question | 2.5 |
| 2026-06-22 | Sent Spencer verified data contract for `getTopicAccuracy` and `getRecommendedQuestion` (exact TypeScript signatures from main); flagged duplicate LogoutButton bug in /dashboard for him to drop during dashboard rewrite | 0.5 |
| 2026-06-22 | Created ER diagram in dbdiagram.io from m2_schema.sql; reviewed against all 7 tables and FK relationships; exported and committed to docs/images/er-diagram.svg on docs/er-diagram branch; opened PR | 2.0 |
| 2026-06-22 | Backfilled M2 project-log entries through Jun 21; recomputed totals | 0.5 |
| 2026-06-23 | Redrew architecture diagram in Excalidraw at full poster resolution (old version was 615×151px — literally the M1 poster crop); used generated SVG for page-flow; committed both on docs/diagrams-refresh; opened PR | 3.0 |
| 2026-06-23 | Checked in on Spencer's first manual testing findings; noted real bugs vs UX nitpicks for Wednesday triage | 0.5 |
| 2026-06-23 | Wrote M2 video script; iterated through three drafts mapped against all 20 PPTX slides with click annotations; corrected a factual error (script said "three questions" — should be "three attempts" per WEAK_TOPIC_MIN_ATTEMPTS); confirmed final draft ready to record | 2.0 |
| 2026-06-24 | Code comments audit on quiz/import/storage/questions files; resolved stale `// !!!!! Will be replaced` TODO in app/modules/new/actions.ts; committed on chore/comments-audit; opened PR | 3.0 |
| 2026-06-24 | Bug triage from Spencer's manual testing findings: sorted into real bugs, UX-only notes, and M3-scope items; documented in docs/bug-triage.md | 2.0 |
| 2026-06-25 | Created NoteFlow_User_Testing_Form.docx — 7-task sheet with 4 feedback questions for async remote testing sessions; sent to Spencer to distribute to testers | 1.5 |
| 2026-06-25 | Bug-fix sweep based on Spencer's testing findings and triage list | 2.5 |
| 2026-06-25 | Iterated README through v1–v10 with codebase verification pass; corrected four factual errors (weak topic threshold 70% → 60%; all three question types implemented; weakness_score formula description wrong; recencyBoost and mistakeRecency are binary not decay functions); added code snippets and file references to all four SE practices; finalised at 612 lines | 4.0 |
| 2026-06-27 | Reviewed Spencer's project log draft; synthesised M2 entries for both team members; backfilled Enosh's Jun 22–25 entries from chat history | 2.0 |
| 2026-06-27 | Fixed module detail page — added chevron and hover colour to topic cards to make navigation affordance explicit; PR merged | 0.5 |
| 2026-06-27 | Fixed topic detail page — subtopics, notes, and question cards had no click affordance; linked each to appropriate target page; removed redundant Edit button from subtopic cards; PR merged | 1.0 |
| 2026-06-27 | Reviewed README v11–v13; corrected vitest screenshot placement, fixed screenshots intro, verified user testing write-up; identified and corrected wrong README push | 2.5 |
| 2026-06-27 | Reviewed two user testing response forms; synthesised findings for user testing README section | 0.5 |
| 2026-06-27 | Wrote user testing write-up for README — Participants, Method, Findings (5 observations), and Changes Made sections; incorporated responses from two NUS student testers | 1.5 |
| **Total**  |                                                                                                           | **104.5** |

---

## Milestone 3 - Extension (30 June - 27 July 2026)

### Spencer Ting

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-06-03 | Reviewed and graded peer teams' Milestone 2 against the rubrics | 1.0 |
| 2026-06-07 | Reviewed TA and peer feedback; ideated implementation changes in response | 2.0 |
| **Total**  |                                                                                                           | **3.0** |

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-07-07 | Wired existing `SubmitButton` (`useFormStatus`) into 10 create/edit forms with per-form pending labels, fixing a duplicate-create bug from double-clicking submit; PR #54 | 1.0 |
| 2026-07-07 | Added `app/error.tsx` route-level error boundary and `lib/errors.ts` (`friendlyMessage()` Postgres error code translation); swapped `throw new Error(error.message)` for `friendlyMessage(error)` across 10 server action files; PR #55 | 1.5 |
| 2026-07-07 | Added semantic design tokens to `globals.css` (light/dark variable pairs), built `MasteryDot` component, added `next-themes` dark/light toggle (`components/theme-toggle.tsx`, using `useSyncExternalStore` to avoid a hydration mismatch); wired into dashboard, layout, and nav bar| 3.5 |
| 2026-07-08 | Reproduced M2 evaluator crash reports on a fresh account; queried `auth.users` for orphaned `profiles` rows, found 4 affected, backfilled via insert; confirmed root cause was pre-trigger signups; documented in `decisions-log.md` | 1.5 |
| 2026-07-08 | Built `lib/seed-data.ts` (two-module seed dataset: CS2030S, GEA1000), `scripts/seed-all.ts` backfill script, `app/modules/sample-data-actions.ts` self-service action wired into the empty `/modules` state; wrote README credentials/setup block| 3.0 |
| 2026-07-09 | Appended `review_schedule` table + RLS to `docs/m3_schema.sql`; built `lib/sm2.ts` pure SM-2 core (correct/incorrect -> quality 4/2 mapping, ease-factor floor at 1.3); wrote 12 Vitest boundary tests in `lib/sm2.test.ts` | 3.0 |
| 2026-07-09 | Built `app/review/actions.ts` (`getDueReviews`, `updateReviewSchedule`, `getDueReviewCount`); hooked `updateReviewSchedule` into `submitAnswer`; fixed its insert error to route through `friendlyMessage()` (was raw `.message`) | 2.0 |
| 2026-07-09 | Built `/review` page and review session UI (`app/review/review-session.tsx`); added nav due-count badge (`nav-items.ts`/`NavLinks.tsx`/`NavBar.tsx`); PR #58; fixed a dash-style copy nit in the empty-state text (PR #59) | 3.0 |
| 2026-07-09 | Built one-click demo login on `/login` (`app/login/demo-actions.ts`) using `DEMO_EMAIL`/`DEMO_PASSWORD` env vars, with a friendly fallback message if the demo account is unavailable; PR #60; fixed a dash-style copy nit in the caption (PR #61) | 1.5 |
| 2026-07-10 | Appended `topic_prerequisites` schema to `docs/m3_schema.sql` - table, same-module trigger, RLS policies scoped through topics -> modules; ran migration in Supabase SQL editor; regenerated TypeScript types | 1.0 |
| 2026-07-10 | Built `lib/prereq.ts` - `wouldCreateCycle` (BFS cycle detection), `blockedTopics` (gating, reusing `WEAK_TOPIC_THRESHOLD`/`WEAK_TOPIC_MIN_ATTEMPTS` from `lib/weak-topics.ts` rather than redefining them), `topologicalLevels` (DAG layout for the graph UI); wrote 12 Vitest boundary tests in `lib/prereq.test.ts` | 4.0 |
| 2026-07-10 | Built `app/modules/[id]/graph/actions.ts` - `getModuleGraph`, `addPrerequisite` (client-side cycle check before insert, since a DB CHECK can't traverse rows), `removePrerequisite` | 2.0 |
| 2026-07-10 | Built `app/modules/[id]/graph/page.tsx` and `graph-view.tsx` - interactive SVG concept graph with draggable nodes, click-to-connect edges, click-to-delete edges, mastery-coloured nodes, animated dashed ring on blocked topics; added a "Concept graph" nav link on the module detail page | 6.0 |
| 2026-07-10 | Wired concept-graph gating into `lib/recommender.ts` - `applyBlockedPenalty` (0.5x score penalty for blocked topics, applied outside the transparent score breakdown so the four terms still sum to `total`); added 2 Vitest tests | 2.0 |
| 2026-07-10 | Debugged a stale `.git/index.lock` blocking branch creation, stash, and commit; resolved manually | 1.0 |
| 2026-07-10 | Built `lib/graph-layout.ts` pure force simulation (link springs, pairwise repulsion + collision, topological column anchor, deterministic seeding); wrote 13 Vitest tests in `lib/graph-layout.test.ts` | |
| 2026-07-10 | Rewrote `graph-view.tsx` as a dynamic canvas - pan/zoom (cursor-anchored wheel + pinch), animated fit-to-view, live physics with drag ripple, prerequisite-chain hover highlighting, hover card (accuracy/attempts/blocked reason), click-to-jump minimap, curved edges; restructured to per-tick snapshot publishing to satisfy the React Compiler `react-hooks/refs` lint | |
| 2026-07-11 | Built `lib/generated-questions.ts` - `parseGenerated` (JSON/fence parsing + per-field validation), `isValidDraft` (reused at parse and save time), `isDuplicate`/`dedupe` (Jaccard token-overlap, 0.8 threshold), `classifyGeminiError`, `buildGenerationPrompt`, `clampCount`/`normalizeTypes`; wrote 46 Vitest boundary/partition tests in `lib/generated-questions.test.ts` | |
| 2026-07-11 | Appended `questions.source` (`'manual'`/`'ai'`) column to `docs/m3_schema.sql`; updated `lib/types/database.ts` Row/Insert/Update types to match (pending a real `supabase gen types` regen once the migration runs) | |
| 2026-07-11 | Built `app/modules/[id]/topics/[topicId]/questions/generate/actions.ts` - `generateQuestionDrafts` (topic + subtopic notes gathering, `gemini-2.5-flash` call via `fetch` with `GEMINI_API_KEY`, `responseMimeType`/`responseSchema` JSON enforcement) and `saveGeneratedQuestions` (re-validation, bulk insert with `source: 'ai'`, single redirect) | |
| 2026-07-11 | Built `.../questions/generate/page.tsx` and `GenerateQuestionsFlow.tsx` - config form (count 1-8, MCQ/short-answer picker), editable review cards with per-card discard and live validation, save/start-over/cancel; wired a "Generate questions" link into the topic detail page | |
| 2026-07-11 | Verified: `npm test` (89/89 passing, 5 files), `npm run lint` (clean), `npx tsc --noEmit` (clean); `npm run build` not runnable in sandbox (SWC binary unavailable) - needs a local build check before commit | |
| 2026-07-11 | Fixed thrown-Error redaction bug: Next.js blanks the message of any Error thrown from a Server Action in production, silently swallowing every friendly message in the AI-gen flow; `generateQuestionDrafts`/`saveGeneratedQuestions` now return `{ ok, message }` for expected failures instead of throwing | |
| 2026-07-11 | `gemini-2.5-flash` started 404ing for new API keys/projects on Google's side (Jul 9 2026, ahead of its listed Oct 16 2026 shutdown - confirmed via Google AI Developers Forum); switched `MODEL` to `gemini-3.5-flash`, Google's listed replacement | |
| 2026-07-11 | Fixed Gemini thinking-token truncation: gemini-3.5-flash's default `thinkingLevel: "medium"` was drawing from the same `maxOutputTokens` budget as the JSON answer, truncating it; set `thinkingLevel: "minimal"` and raised the budget to 4096; added raw-response logging on parse failure | |
| 2026-07-11 | Added `ai_generation_log` table + RLS (`docs/m3_schema.sql`) and a shared daily cap (`DAILY_GENERATION_CAP`, `isOverDailyCap` in `lib/generated-questions.ts`) on Gemini calls, since one `GEMINI_API_KEY` is shared across every tester on this deployment; capped requests get a message pointing at the milestone video instead of calling Gemini; wrote 5 more Vitest tests | |
| **Total**  |                                                                                                           | **39.0** |

---

## Splashdown (28 July - 26 August 2026)

### Spencer Ting

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
|            |                                                                                                           |       |
| **Total**  |                                                                                                           | **0.0** |

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
|            |                                                                                                           |       |
| **Total**  |                                                                                                           | **0.0** |

---

## Cumulative Hours Summary

| Milestone        | Deadline        | Spencer's Hours | Enosh's Hours | Combined |
|------------------|-----------------|-----------------|---------------|----------|
| Liftoff          | 18 May 2pm SGT  | 10.5            | 11.5          | 22.0     |
| Milestone 1      | 1 Jun 2pm SGT   | 17.0            | 30.0          | 47.0     |
| Milestone 2      | 29 Jun 2pm SGT  | 54.5            | 104.5         | 159.0    |
| Milestone 3      | 27 Jul 2pm SGT  | 3.0             | 39.0          | 42.0     |
| Splashdown       | 26 Aug          | 0.0             | 0.0           | 0.0      |
| **Running Total**|                 | **85.0**        | **185.0**     | **270.0**|
| **Target**       | By Splashdown   | **140**         | **140**       | **280**  |

---

## Notes

- All hours include debugging, reading, and self-learning, counted per Orbital guidelines.
- Mobile setup hours from 9 May are kept despite the stack switch as the time was genuinely spent.
- AI tools were used only for self-learning and debugging help, not for generating code or submission content, in line with Orbital policy.
- Enosh Er led setup, infrastructure, and documentation during Milestone 1. Spencer Ting led feature development and video production. Both contributed to code and content.
