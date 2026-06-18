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
| 2026-05-25 | Reviewed Orbital programme overview requirements for Milestone 1; planned week 2 task split with Enosh | 1.0   |
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
|            |                                                                                                           |       |
| **Total**  |                                                                                                           | **0.0** |

### Enosh Er

| Date       | Task                                                                                                      | Hours |
|------------|-----------------------------------------------------------------------------------------------------------|-------|
| 2026-06-08 | Reviewed and graded peer teams' Milestone 1 proof of concepts against the rubrics; reviewed TA and peer feedback received on NoteFlow; ideated implementation changes in response | 2.0 |
| 2026-06-08 | Ran M2 schema migration in Supabase SQL editor; created all 7 tables, RLS policies, triggers, cascade deletes; debugged idempotency issues; verified auth trigger creates profile rows on signup | 2.5 |
| 2026-06-08 | Generated TypeScript types from Supabase; wired `Database` type into Supabase clients; debugged working directory and keychain issues; committed and opened PR on `chore/db-types` | 1.5 |
| 2026-06-09 | Built modules list page (Pattern A reference page); RLS-scoped fetch, empty state, error handling | 3 |
| 2026-06-09 | Built create module form (Pattern B); server action with validation, Supabase insert, redirect; debugged a stray folder and a dropped git push | 3 |
| 2026-06-09 | Debugged seed data script — null user_id error traced to a missing profiles row from signing up before the handle_new_user trigger existed; fixed with manual insert; saved cleaned script to `docs/seed-data.sql` | 1.5 |
| 2026-06-09 | Worked out a file ownership matrix to prevent merge conflicts | 0.5 |
| 2026-06-15 | Module edit + delete server actions; | 2.5 |
| 2026-06-15 | Topic create/edit/delete server actions following the `.bind` nested-resource pattern | 2 |
| 2026-06-15 | Debugged stray untracked `supabase/.temp` cache folder; added to `.gitignore` | 0.5 |
| 2026-06-15 | Added M2 schema migration to the repo for the first time; | 0.5 |
| 2026-06-15 | Debugged branch/commit mix-up from working on the wrong branch; fixed a filename typo; re-pushed affected PRs | 0.5 |
| 2026-06-16 | Built Supabase Storage setup — private `note-files` bucket, RLS policies, `lib/storage.ts` helper; smoke-tested upload via Supabase dashboard | 3 |
| 2026-06-16 | Subtopic create/edit/delete server actions following Pattern C; commit `847bed9` on `feat/subtopics-actions` | 3 |
| 2026-06-16 | Debugged a branch/commit mix-up — storage work had landed on the subtopics branch with stray files; cleaned up and force-pushed a clean commit | 1 |
| 2026-06-17 | Merged main into `feat/storage-setup` and `feat/subtopics-actions`; reran lint and build; | 2.5 |
| 2026-06-17 | Wrote `createQuestion` server action — MCQ option parsing, answer-matching validation, difficulty check; on `feat/questions-actions` | 3.5 |
| 2026-06-18 | Built shared nav bar (NavBar, NavLinks, FlowMark, nav-items) so /modules is reachable from the dashboard; wired into app/layout.tsx; fixed LogoutButton import (was a default export, not named); removed duplicate LogoutButton from dashboard page; installed Homebrew and GitHub CLI for PR workflow | 3 |
| 2026-06-18 | Wrote getNoteLocation helper (lib/notes.ts) and notes create/edit/delete actions with file upload (lib/storage.ts integration); on feat/notes-actions branch | 2 |
| 2026-06-18 | Quiz answer submission + attempt recording — submitAnswer server action (MCQ/short-answer case-insensitive match, long_answer always marked correct) | 2 |
| **Total**  |                                                                                                           | **40.0** |

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
|            |                                                                                                           |       |
| **Total**  |                                                                                                           | **0.0** |

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
| Milestone 2      | 29 Jun 2pm SGT  | 0.0             | 40.0          | 40.0     |
| Milestone 3      | 27 Jul 2pm SGT  | 0.0             | 0.0           | 0.0      |
| Splashdown       | 26 Aug          | 0.0             | 0.0           | 0.0      |
| **Running Total**|                 | **27.5**        | **79.5**      | **109.0**|
| **Target**       | By Splashdown   | **140**         | **140**       | **280**  |

---

## Notes

- All hours include debugging, reading, and self-learning, counted per Orbital guidelines.
- Mobile setup hours from 9 May are kept despite the stack switch as the time was genuinely spent.
- AI tools were used only for self-learning and debugging help, not for generating code or submission content, in line with Orbital policy.
- Enosh Er led setup, infrastructure, and documentation during Milestone 1. Spencer Ting led feature development and video production. Both contributed to code and content.
