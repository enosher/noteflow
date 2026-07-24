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
| 2026-06-03 | Completed Next.js Learn chapters 3-5: layouts, pages, fonts, images | 3.0 |
| 2026-06-04 | Completed Next.js Learn chapters 6-9: databases, data fetching, static and dynamic rendering | 3.5 |
| 2026-06-05 | Completed Next.js Learn chapters 10-13: streaming, search, pagination | 3.5 |
| 2026-06-06 | Completed Next.js Learn chapters 14-16: mutations, error handling, accessibility, authentication | 3.5 |
| 2026-06-07 | Sketched wireframes for all M2 pages in Excalidraw; reviewed Enosh's scaffold pages and patterns guide; agreed on URL structure | 2.5 |
| 2026-06-09 | Reviewed Enosh's reference scaffold pages and patterns guide document; set up local dev environment with updated schema and seed data; tested modules list page with seed data | 2.5 |
| 2026-06-10 | Studied TypeScript types and server action patterns in the codebase; traced through the module create and update actions; read through Supabase query patterns | 2.5 |
| 2026-06-13 | Reviewed schema changes and RLS policies in Supabase dashboard; studied nested URL structure for module → topic → subtopic hierarchy | 2.0 |
| 2026-06-14 | Planned UI component hierarchy for all M2 pages; drafted module, topic, subtopic, notes, and questions page layouts | 2.0 |
| 2026-06-16 | Reviewed and merged Enosh's storage setup, subtopics actions, gitignore, and module edit/delete pull requests; tested module CRUD flow on the Vercel preview URL | 1.5 |
| 2026-06-17 | Built read-only module detail page (app/modules/[id]/page.tsx) showing the topics list for a given module | 2.0 |
| 2026-06-17 | Built module edit form and delete button UI following Enosh's create-form pattern; wired to the update and delete server actions | 1.5 |
| 2026-06-17 | Built topics list and create-topic form pages within module detail; connected to the topic server actions | 1.5 |
| 2026-06-18 | Reviewed and merged Enosh's topics actions, schema docs, questions actions, quiz flow, nav bar, and notes storage pull requests; tested on Vercel preview URLs | 2.5 |
| 2026-06-19 | Reviewed and merged Enosh's notes actions and project log update pull requests | 1.0 |
| 2026-06-21 | Built notes list, note detail, create-note and edit-note pages with markdown textarea, rendered preview, and file upload display | 3.0 |
| 2026-06-21 | Built questions list page and create-question form with MCQ option fields and difficulty selector | 2.0 |
| 2026-06-22 | Built dashboard UI: weak topics panel, per-topic accuracy table, and recommendation card showing top recommended question with score-breakdown debug view | 5.5 |
| 2026-06-23 | Executed manual system testing; documented 25+ test cases with screenshots in docs/manual-test-log.md | 6.0 |
| 2026-06-27 | Took M2 screenshots of all core feature pages (modules list, module detail, topic detail, quiz answer, quiz results, dashboard); committed 6 screenshots to docs/images/ | 1.0 |
| **Total**  |                                                                                                           | **54.5** |

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-06-08 | Reviewed and graded peer teams' Milestone 1 proof of concepts against the rubrics; reviewed TA and peer feedback received on NoteFlow; ideated implementation changes in response | 2.0 |
| 2026-06-08 | Ran M2 schema migration in Supabase SQL editor; created all 7 tables, RLS policies, triggers, cascade deletes; debugged idempotency issues; verified auth trigger creates profile rows on signup | 2.5 |
| 2026-06-08 | Generated TypeScript types from Supabase; wired the database type into the Supabase clients; debugged working directory and keychain issues; committed and opened a pull request | 1.5 |
| 2026-06-08 | Review and synthesised peer-review and TA feedback | 1.5 |
| 2026-06-08 | Ideated week-by-week task breakdown, mandatory vs optional deliverables, role split | 1.5 |
| 2026-06-09 | Built modules list page (reference list-page pattern); RLS-scoped fetch, empty state, error handling | 3.0 |
| 2026-06-09 | Built create module form (reference create-form pattern); server action with validation, Supabase insert, redirect; debugged a stray folder and a dropped git push | 3.0 |
| 2026-06-09 | Debugged seed data script - null user_id error traced to a missing profiles row from signing up before the profile-creation trigger existed; fixed with manual insert; saved cleaned script to docs/seed-data.sql | 1.5 |
| 2026-06-09 | Worked out a file ownership matrix to prevent merge conflicts | 0.5 |
| 2026-06-15 | Module edit and delete server actions | 2.5 |
| 2026-06-15 | Topic create, edit, and delete server actions following the nested-resource binding pattern | 2.0 |
| 2026-06-15 | Debugged stray untracked Supabase cache folder; added it to gitignore | 0.5 |
| 2026-06-15 | Added M2 schema migration to the repo for the first time | 0.5 |
| 2026-06-15 | Debugged branch/commit mix-up from working on the wrong branch; fixed a filename typo; re-pushed affected pull requests | 0.5 |
| 2026-06-16 | Built Supabase Storage setup - private notes-files bucket, RLS policies, storage helper library; smoke-tested upload via Supabase dashboard | 3.0 |
| 2026-06-16 | Subtopic create, edit, and delete server actions following the same nested-resource pattern | 3.0 |
| 2026-06-16 | Debugged a branch/commit mix-up - storage work had landed on the subtopics branch with stray files; cleaned up and force-pushed a clean commit | 1.0 |
| 2026-06-17 | Merged main into the in-progress storage setup and subtopics actions branches; reran lint and build | 2.5 |
| 2026-06-17 | Wrote the create-question server action - MCQ option parsing, answer-matching validation, difficulty check | 3.5 |
| 2026-06-17 | Reviewed Spencer's module detail and topic pull requests; found and removed an unused, deprecated auth-helpers dependency that reappeared after a rebase; resolved a merge conflict on the module detail page; confirmed one pull request had zero new commits and closed it | 1.5 |
| 2026-06-18 | Built shared nav bar so /modules is reachable from the dashboard; wired into the root layout; fixed the logout button import (was a default export, not named); removed a duplicate logout button from the dashboard page; installed Homebrew and GitHub CLI for the pull request workflow | 3.0 |
| 2026-06-18 | Designed NoteFlow logo/icon - explored five initial concept directions in SVG; narrowed to two, then converged on a "Flowing Note" concept (page with folded corner, header lines, wave as horizon line, rising graph line with data dots, loop arrow); iterated colour from teal to cream | 4.0 |
| 2026-06-18 | Wrote the note location helper and notes create, edit, and delete actions with file upload integration | 2.0 |
| 2026-06-18 | Quiz answer submission and attempt recording - submit-answer server action (MCQ/short-answer case-insensitive match, long-answer questions always marked correct) | 2.0 |
| 2026-06-18 | Created the decisions log document to record major decisions across Liftoff, M1 and M2 (stack switch, Apollo 11 scope, schema choices, storage conventions, scaffold patterns, quiz grading, weak-topic thresholds, recommender weights) | 3.0 |
| 2026-06-19 | Built the markdown paste import page, reusing the existing create-note action bound to the topic | 2.0 |
| 2026-06-19 | Implemented finalised NoteFlow logo into the nav bar | 1.0 |
| 2026-06-19 | Updated the decisions log with schema, scaffold pattern, quiz grading, weak-topic threshold, and recommender weight decisions | 1.5 |
| 2026-06-20 | Built the weak-topics helper library - topic accuracy calculation and weak-topic detection, with modifiable threshold and minimum-attempt constants | 3.0 |
| 2026-06-20 | Built the recommender helper library - a weighted-sum scoring function using data from the weak-topics helper | 1.0 |
| 2026-06-20 | Added zoom feature for users to admire the logo; fixed logo dimensions, logo flap colour, and the zoom background contrast across three follow-up commits | 2.0 |
| 2026-06-21 | Wrote unit tests for the weak-topics and recommender helper libraries (16 tests incl edge cases); fixed a Supabase nested-relation cast in the recommender to match the established subtopics pattern | 2.5 |
| 2026-06-21 | Built quiz-taking UI (start screen, questions, results) | 2.0 |
| 2026-06-21 | Fixed a missing pending state on the note save button - prevents a silent hang and double-submit | 1.0 |
| 2026-06-21 | Built the score-breakdown view to explain the recommendations - shows the weighted sub-scores (topic weakness, recency boost, mistake recency, difficulty match) behind each recommended question | 2.5 |
| 2026-06-22 | Sent Spencer a verified data contract for the topic-accuracy and recommended-question functions (exact TypeScript signatures from main); flagged a duplicate logout button bug in the dashboard for him to drop during the dashboard rewrite | 0.5 |
| 2026-06-22 | Created an ER diagram in dbdiagram.io from the M2 schema; reviewed against all 7 tables and foreign-key relationships; exported and committed the diagram; opened a pull request | 2.0 |
| 2026-06-22 | Backfilled M2 project-log entries through Jun 21; recomputed totals | 0.5 |
| 2026-06-23 | Redrew the architecture diagram in Excalidraw at full poster resolution (the old version was a low-resolution crop of the M1 poster); used a generated diagram for the page-flow; committed both and opened a pull request | 3.0 |
| 2026-06-23 | Checked in on Spencer's first manual testing findings; noted real bugs vs UX nitpicks for Wednesday triage | 0.5 |
| 2026-06-23 | Wrote M2 video script; iterated through three drafts mapped against all 20 slides with click annotations; corrected a factual error (script said "three questions" - should be "three attempts" per the weak-topic minimum-attempt constant); confirmed final draft ready to record | 2.0 |
| 2026-06-24 | Code comments audit on the quiz, import, storage, and questions files; resolved a stale TODO comment in the create-module action; committed and opened a pull request | 3.0 |
| 2026-06-24 | Bug triage from Spencer's manual testing findings: sorted into real bugs, UX-only notes, and M3-scope items; documented in docs/bug-triage.md | 2.0 |
| 2026-06-25 | Created a 7-task user testing form with 4 feedback questions for async remote testing sessions; sent to Spencer to distribute to testers | 1.5 |
| 2026-06-25 | Bug-fix sweep based on Spencer's testing findings and triage list | 2.5 |
| 2026-06-25 | Iterated README through ten drafts with a codebase verification pass; corrected four factual errors (weak topic threshold 70% → 60%; all three question types implemented; weakness-score formula description wrong; recency-boost and mistake-recency described as decay functions when they're actually binary); added code snippets and file references to all four software-engineering practices; finalised at 612 lines | 4.0 |
| 2026-06-27 | Reviewed Spencer's project log draft; synthesised M2 entries for both team members; backfilled Enosh's Jun 22-25 entries from chat history | 2.0 |
| 2026-06-27 | Fixed module detail page - added chevron and hover colour to topic cards to make navigation affordance explicit | 0.5 |
| 2026-06-27 | Fixed topic detail page - subtopics, notes, and question cards had no click affordance; linked each to its target page; removed redundant edit button from subtopic cards | 1.0 |
| 2026-06-27 | Reviewed further README drafts; corrected screenshot placement, fixed the screenshots intro, verified the user testing write-up; identified and corrected a wrong README push | 2.5 |
| 2026-06-27 | Reviewed two user testing response forms; synthesised findings for user testing README section | 0.5 |
| 2026-06-27 | Wrote user testing write-up for README - Participants, Method, Findings (5 observations), and Changes Made sections; incorporated responses from two NUS student testers | 1.5 |
| **Total**  |                                                                                                           | **104.5** |

---

## Milestone 3 - Extension (30 June - 27 July 2026)

### Spencer Ting

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
|            |                                                                                                           |       |
| **Total**  |                                                                                                           | **0.0** |

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-07-07 | Wired the existing submit-button component into 10 create/edit forms with per-form pending labels, which fixes a "duplicate-create" bug from double-clicking submit | 1.0 |
| 2026-07-07 | Added a route-level error boundary and a shared error-translation helper (mapping Postgres error codes to plain-language messages); swapped raw thrown error messages for understandable versions | 1.5 |
| 2026-07-07 | Added design elements to the global stylesheet (light/dark pairs), built a mastery-indicator component, and added a dark/light theme toggle; wired into dashboard, layout, and nav bar | 3.5 |
| 2026-07-08 | Reproduced M2 evaluator crash reports on a fresh account; queried for orphaned profile rows, found 4 affected, backfilled via insert; confirmed root cause was accounts created before the profile-creation trigger existed; documented in the decisions log | 1.5 |
| 2026-07-08 | Built a seed dataset with 2 modules (CS2030S and GEA1000), a backfill script for existing accounts, and a self-service "add sample data" action wired into the empty modules state; wrote the README credentials/setup section | 3.0 |
| 2026-07-09 | Appended the review schedule table and RLS policies to the M3 schema; built the pure SM-2 spaced-repetition core (correct/incorrect mapped to a quality grade, ease factor floored); wrote 12 boundary tests | 3.0 |
| 2026-07-09 | Built the review backend actions (getting due reviews, updating the review schedule, counting due reviews); linked the schedule update into answer submission | 2.0 |
| 2026-07-09 | Built the review frontend page and review session UI; added a due-count badge to the nav bar | 2.0 |
| 2026-07-09 | Built one-click demo login on the login page, with a fallback message if the demo account is unavailable | 1.5 |
| 2026-07-10 | Added the topic prerequisites schema to the M3 schema - table, same-module trigger, RLS policies scoped through topics to modules; ran the migration in the Supabase SQL editor; regenerated TypeScript types | 1.0 |
| 2026-07-10 | Built the prerequisite helper library - cycle detection, topic gating, and a topological layout function for the graph UI; wrote 12 boundary tests | 2.0 |
| 2026-07-10 | Built the concept graph server actions - fetching the module graph, adding a prerequisite (checking for cycles before insert) | 1.5 |
| 2026-07-10 | Built the concept graph page and view - interactive SVG graph with draggable nodes, click-to-connect and click-to-delete edges, mastery-coloured nodes, an animated ring on blocked topics | 2.0 |
| 2026-07-10 | Wired concept-graph gating into the recommender; added 2 tests | 1.0 |
| 2026-07-10 | Debugged a stale git lock file blocking branch creation, stash, and commit; resolved manually | 0.5 |
| 2026-07-10 | Added physics into the graph, inspired by Obsidian (link springs, repulsion and collision, topological column anchoring, deterministic seeding); wrote 13 tests | 2.0 |
| 2026-07-10 | Rewrote the graph view as a dynamic canvas - zoom, fit-to-view, live physics with drag ripple, prerequisite-chain hover highlighting, a hover card showing accuracy/attempts/blocked reason, a click-to-jump minimap, and curved edges | 3.0 |
| 2026-07-11 | Built the AI question generation helper library; wrote 46 boundary and edge-case tests | 3.0 |
| 2026-07-11 | Appended a question-source column (manual or AI-generated) to the M3 schema; updated the TypeScript database types to match it | 0.5 |
| 2026-07-11 | Built the question generation server actions - gathering topic and subtopic notes, calling the Gemini API (gemini-2.5-flash), and saving generated questions after re-validation | 2.0 |
| 2026-07-11 | Built the question generation page and review flow; added a "Generate questions" link on the topic detail page | 2.5 |
| 2026-07-11 | Verified the full test suite (89 tests passing), ran lint, and type checking were all clean before committing | 0.5 |
| 2026-07-11 | Fixed a thrown-error redaction bug: Next.js blanks the message of any error thrown from a server action in production, covering every helpful message in the AI generation flow; the generation actions now return a result object for expected failures instead of throwing | 1.0 |
| 2026-07-11 | gemini-2.5-flash started returning errors for new API keys ahead of its listed shutdown date; switched to gemini-3.5-flash | 0.5 |
| 2026-07-11 | Fixed a gemini-3.5-flash response truncation bug: its default "thinking" token budget was drawing from the same output budget as the actual answer, truncating it; lowered the thinking budget and raised the output budget; added raw-response logging on parse failure | 1.0 |
| 2026-07-11 | Added a generation log table and a shared daily cap on AI generation calls, since one API key is shared across every tester on this deployment; capped requests get a message pointing at the milestone video instead of calling the API; wrote 5 more tests | 1.5 |
| 2026-07-11 | Added more tests for AI generation - duplicate-detection threshold and recency-boundary edge cases | 1.0 |
| 2026-07-12 | Rewrote the README - restructured the table of contents, added figure labels to all diagrams, and wrote the full M3 section for spaced repetition, the concept graph, AI question generation, error handling, and sample data | 2.5 |
| 2026-07-12 | Visual language pass - paper-physics shadows, ruled surfaces, and a type hierarchy across around 25 page files; completed the remaining hardcoded-colour-to-token migration; merged the latest changes from main into the branch, resolving conflicts across 16 files; opened and merged the pull request | 5.0 |
| 2026-07-16 | Restored the review session's paper/ruled-paper styling after a regression; reseeded review queue and concept-graph edges into the demo account; added a CI workflow for lint, tests, and build; added a severity policy and Known Issues table to the manual test log | 3.5 |
| 2026-07-17 | Fixed a recommendation-scoring bug caused by a stale quiz-attempt timestamp; built a reset-on-logout mechanism for the shared demo account; added a subtopic-level note creation entry point | 3.0 |
| 2026-07-18 | README pass for Milestone 3 submission; captured and renamed the outstanding M2/M3 screenshots to match the README's figure references | 3.0 |
| 2026-07-19 | Fixed seed-data gaps behind AI-generation failures found in user testing; added review/quiz feedback and a persistent sidebar; added GEA1000 as a second demo module; updated the README's Testing, User Testing, and auth-page sections with the remaining screenshots | 4.5 |
| 2026-07-24 | Diagnosed a Gemini 3.5-flash outage as a Google-side bug and added a timeout plus fallback to gemini-3.1-flash-lite; regenerated the ER diagram with the missing M3 tables; redrew the poster's page-flow diagram; wrote the M3 user-testing script and guide; added an in-app link to the recommendation score-breakdown view | 4.5 |
| **Total**  |                                                                                                           | **71.5** |

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
| Milestone 3      | 27 Jul 2pm SGT  | 0.0             | 71.5          | 71.5     |
| Splashdown       | 26 Aug          | 0.0             | 0.0           | 0.0      |
| **Running Total**|                 | **82.0**        | **217.5**     | **299.5**|
| **Target**       | By Splashdown   | **140**         | **140**       | **280**  |

---

## Notes

- All hours include debugging, reading, and self-learning, counted per Orbital guidelines.
- Mobile setup hours from 9 May are kept despite the stack switch as the time was genuinely spent.
- AI tools were used only for self-learning and debugging help, not for generating code or submission content, in line with Orbital policy.
- Enosh Er led setup, infrastructure, and documentation during Milestone 1. Spencer Ting led feature development and video production. Both contributed to code and content.
- Dates logged are generally the day a piece of work was finished and committed, not necessarily every day it was worked on - some tasks spanned more than one day, so the date column should be read as "completed on," not as a precise day-by-day timesheet.
