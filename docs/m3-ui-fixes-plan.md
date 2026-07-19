# M3 User Testing — Fix Plan

Technical plan for the highest/high/medium-priority items from the Milestone 3 User Testing
round (see README.md → User Testing → Milestone 3 User Testing). No code yet — this is the
"what and where" so implementation can happen fix-by-fix. Each section cites the actual
current implementation, not a guess, so effort estimates are grounded.

The "empty review queue" finding (Testers 1/2) is already fixed and excluded here — the
NavLinks badge and getDueReviewCount plumbing referenced below is that fix.

---

## Highest priority

### 1. AI question generation failing outright (Testers 3, 5) — ROOT CAUSE CONFIRMED

**Diagnosed (19 Jul 2026):** the failure was the "no usable notes" branch, not a Gemini-side
error. `generateQuestionDrafts()` (`app/modules/[id]/topics/[topicId]/questions/generate/actions.ts`)
filters to notes where `content` is non-null and non-empty (line ~98-100) before ever calling
Gemini. A note created by uploading a file (PDF or otherwise) has `file_url` set but
`content` stays `null` — there is no text-extraction step for uploads (see the comment at
line 95-97, which already said this). Tester 5 uploaded a past-year exam **as a PDF file
attachment**, not as pasted/typed text, so it never counted as usable content — the topic
looked note-less to `generateQuestionDrafts()` even though a file was clearly attached.

This also explains part of Tester 3's experience without them realizing it: auditing
`lib/seed-data.ts` and `lib/seed-demo-data.ts` (the "Load sample data" and demo-account seed
sources) found that **exactly half the seeded topics in every module had zero notes at all**
— Polymorphism and Streams in CS2030S, Probability Basics and Correlation vs Causation in
GEA1000, and all four topics across the two secondary demo modules (MA1521, ST2334). Any
tester who tried "Generate questions" on one of those topics would hit the identical
"no usable note content" message regardless of Gemini, the model, or the daily cap.

**Mitigated (19 Jul 2026):** added a real markdown note (~3-6 lines, same style as the
existing ones) to every previously note-less topic in both seed files, and added
`lib/seed-data.test.ts` asserting every topic in `SEED_MODULES` has at least one note with
non-empty content, so this can't silently regress. This fixes the demo/testing experience —
anyone using "Load sample data" or the demo login now has real, generation-ready content
behind every topic.

**Still open, and distinct from the above:** real users who create their own account and add
notes by uploading a PDF (or any file) *without* also typing or pasting text into the note's
content field will still hit "no usable note content," because the product genuinely has no
PDF/file text-extraction step. That's a real feature gap, not a seed-data gap, and the seed
fix above doesn't touch it. Two options, not yet decided:
1. Add a client- or server-side PDF-to-text extraction step (e.g. `pdf-parse` or similar) so
   an uploaded PDF also populates `content`. Real work — parsing quality varies, and it would
   need to run somewhere with enough time/memory budget (a serverless function has limits).
2. Leave file-only notes unsupported for generation, but say so explicitly in the note-upload
   UI itself (not just in the README's Known Limitations) — e.g. "Add some typed notes too if
   you want AI-generated questions from this topic" next to the file upload field.
Given the 27 Jul deadline, (2) is the realistic scope for M3; (1) is worth flagging as future
work.

**Also worth doing:** `classifyGeminiError()` (`lib/generated-questions.ts:252`) still falls
through to a generic message for any unclassified status (e.g. a 404), which remains an
un-diagnosed gap for *actual* Gemini-side failures, separate from the note-content issue
above. Lower priority now that the more common failure mode is understood and fixed.

### 2. Concept graph: clicking fails to clear a prerequisite (Tester 5)

**Current implementation:** `app/modules/[id]/graph/graph-view.tsx`. Two different click
mechanics exist on the same canvas: clicking a *node* twice (`handleNodeClick`, line 348) sets
a prerequisite; clicking an *edge* (the curved connector between two nodes,
`handleRemoveEdge`, line 368) removes one. The edge's clickable hit-area is a transparent
`<path>` with `strokeWidth={14}` (line 537) — a fairly thin, curved target — and the only
affordance that it's clickable is a "Click to remove dependency" text label that appears
**only while already hovering it** (`hoveredEdge === i`, lines 557-568). There's no persistent
visual cue (icon, button, list) that edges are removable at all, and no way to remove a
prerequisite except finding and clicking that exact curve.

**Plan:**
1. Add a persistent (not hover-only) visual cue that edges are clickable — e.g. a small "×"
   icon at the edge midpoint, always visible, or a lighter dashed style with a tooltip on
   first graph visit.
2. Increase the effective hit area or add a dedicated "Prerequisites" list/panel per node
   (on hover card, which already exists at lines 727-757) with explicit remove buttons, as a
   more discoverable alternative to precision-clicking a curve.
3. Confirm `removePrerequisite()` (`app/modules/[id]/graph/actions.ts`) itself works correctly
   in isolation — Tester 5's report ("failed to clear dependency on click") could also mean
   the click never landed on the 14px path rather than a server-side bug; worth a quick manual
   click-precision test before assuming the action itself is broken.

**Effort:** Step 1 is small (SVG/CSS only). Step 2 is medium (new UI surface on the hover
card). Step 3 is a 5-minute manual check that determines whether this is UX-only or also a
real bug.

---

## High priority

### 3. No persistent navigation / can't tell where you are (Testers 4, 5)

**Current implementation:** `components/Breadcrumbs.tsx` already exists and renders a
Modules / Module / Topic trail, but only accepts `moduleId` and `topicId` props — it has no
concept of subtopic or note, so even on the note-view page
(`app/modules/[id]/topics/[topicId]/notes/[noteId]/page.tsx`) the breadcrumb stops at the
topic, never naming the note itself. It's also not used at all on `/dashboard`, `/review`, or
`/modules` (grep shows it only in 9 of the app's ~15 top-level pages). Note-view pages
(`notes/[noteId]/page.tsx`) have no sibling-notes list or prev/next control — switching notes
requires navigating back to the topic page and clicking another one, matching Tester 4's "no
sidebar... can't switch between notes easily."

**Plan:**
1. Extend `Breadcrumbs` to accept an optional `subtopicId`/`noteId` (or a generic trailing
   `label`) so the note-view and question-edit pages can show the full path.
2. Add `Breadcrumbs` to `/review`, `/dashboard`, and the graph page's own trail if missing, for
   consistent orientation app-wide.
3. Add a lightweight sibling-notes list to the note-view page — reuse the same query already
   done on the topic page (`notes` for a given `topic_id`), rendered as a slim list/rail so a
   user can jump between notes in the same topic without leaving the page. This is a smaller
   lift than a full persistent sidebar and directly answers Tester 4's specific complaint.
4. **Built (19 Jul 2026):** a full persistent left sidebar (`components/Sidebar.tsx` +
   `components/SidebarNav.tsx`), rendered from `app/layout.tsx` alongside `NavBar`. Server
   component fetches the whole module → topic → subtopic → note tree per signed-in user (RLS
   scopes it, same pattern as `app/modules/page.tsx`); client component handles expand/collapse
   and highlights the active module/topic/note by parsing them out of `usePathname()`, since
   the root layout sits above any dynamic route segment and has no `params` to read directly.
   Desktop-only (`hidden lg:block`) for this pass - no mobile drawer/hamburger yet, which would
   need its own design pass rather than being folded in here.

**Effort:** Steps 1-2 are small (prop + a few new call sites) - done. Step 3 is small-medium
(new component, one new query) - done. Step 4 turned out to be a half-day, not a separate
milestone: most of the complexity was in getting expand/collapse state right without an
effect-based anti-pattern (see git diff for `SidebarNav.tsx`), not in the data fetching or
layout itself.

### 4. Recommendation and weak-topic signals easy to miss (Testers 3, 4)

**Current implementation:** `app/dashboard/page.tsx`. Two distinct issues, both traceable to
specific lines:
- The recommendation card's label "Recommended next" (line 211) renders as
  `text-sm text-muted` — small and pale — directly above the actual question prompt, which is
  `text-2xl`. The label is easy to skim past even though the card itself is prominent.
- **There are two separately-labeled "Weak topics"** on the same page: a static KPI number in
  the top strip (line 147-153, plain text, not a link, not interactive) and a second,
  genuinely interactive pill list further down (line 293-311, each pill links to that topic).
  Tester 4's exact complaint — found the heading at the top, couldn't interact with it, only
  later noticed the real list below — matches this duplication precisely.

**Plan:**
1. Make the KPI-strip "Weak topics" number a `Link` down to the pill section (anchor scroll)
   or, simpler, drop the word "topics" from the KPI label (e.g. "Weak" → count) so it doesn't
   read as a second, separate "weak topics" feature.
2. Increase visual weight on "Recommended next" — larger/darker label, or an icon, so it reads
   as a heading rather than muted meta-text.

**Effort:** Both are small, CSS/copy-level changes in one file.

### 5. Adding a note inside a topic isn't discoverable from the module page (Tester 3)

**Current implementation:** `app/modules/[id]/page.tsx`, the topics list (lines 85-106). Each
topic row is a `Link` wrapping the topic name, but — unlike the equivalent list on the topic
detail page (`app/modules/[id]/topics/[topicId]/page.tsx`, lines 77-80 and 141-146, which use
a `›` chevron plus `group-hover:text-brand group-hover:underline`) — this specific list never
got that treatment. It renders as plain black text next to the styled "Edit" / "Delete"
actions, so it doesn't read as clickable. This is the same chevron-affordance pattern already
built in M2 (see README → User Testing → Changes Made) — it just wasn't applied to this one
list.

**Plan:** Apply the same chevron + hover-brand-underline classes already used on the topic
page's subtopic/notes rows to the module page's topic rows, for consistency.

**Effort:** Trivial — a few className changes in one file, same pattern already proven
elsewhere in the codebase.

---

## Medium priority

### 6. No correctness feedback in review (Tester 3)

**Current implementation:** `app/review/review-session.tsx`. Non-MCQ cards already have a
full reveal → correct-answer box → Mark correct/incorrect flow (lines 81-113). **MCQ cards do
not** — clicking an option calls `grade(opt === current.answer)` immediately (line 70-73),
which advances the queue in the same tick with no visible right/wrong state shown first. The
session-end screen (lines 22-36) shows how many cards were reviewed (`done`) but not how many
were correct.

**Plan:**
1. For MCQ, split the click into two steps like the non-MCQ flow: on click, mark the selected
   option visually (correct/incorrect styling) and show the right answer if wrong, holding a
   brief "reviewed" state before advancing — grading only happens once the user acknowledges
   (or after a short delay), rather than grading and slicing the queue synchronously.
2. Track a `correctCount` alongside `done` (same pattern `QuizRunner.tsx` already uses,
   lines 32/56/87/101) and show it on the "You're all caught up" screen instead of just the
   review count.

**Effort:** Small-medium — mirrors patterns that already exist in this same file (non-MCQ
reveal) and in `QuizRunner.tsx` (correct-count tracking), so it's mostly porting an existing
pattern rather than new design.

### 7. Static quiz question order and MCQ option order (Tester 3)

**Current implementation:** `app/modules/[id]/topics/[topicId]/quiz/page.tsx`, the Supabase
query (lines 14-17) has no `.order()` — Postgres returns rows in a consistent-but-arbitrary
order with no explicit sort, which is why Tester 3 saw the same sequence on repeated
attempts. `QuizRunner.tsx` renders `current.options.map()` (line 134) in whatever order the
`options` array came back from the database, also unshuffled.

**Plan:**
1. Shuffle the `questions` array after fetching, before passing it to `QuizRunner` (a simple
   Fisher-Yates on the server component, or client-side in `QuizRunner` on mount) so each
   attempt gets a fresh order.
2. Shuffle each question's `options` array the same way, independently per question, so MCQ
   answer position isn't memorizable. Needs to happen after fetch but before render — a
   `useMemo` shuffling `current.options` once per question (keyed by question id) in
   `QuizRunner` would keep the shuffle stable within a single attempt at that question, and
   AI-generated MCQ (`lib/generated-questions.ts`) is unaffected since shuffling happens at
   display time, not storage time.

**Effort:** Small — self-contained, no schema or server-action changes needed since both are
pure display-order changes over data already being fetched.

---

## Status (19 Jul 2026)

Items 2-7 are implemented, including the full persistent sidebar under item 3 (chevron,
dashboard copy, quiz/MCQ shuffle, review MCQ feedback, breadcrumb/note-nav + sidebar, concept
graph remove-badge) — see git diff for the actual changes. Item 1 was root-caused and the
demo/testing-facing part is mitigated (seed data filled in); the real-user PDF-upload gap it
also exposed is now tracked in the README's own [Future Work](../README.md#future-work)
section rather than only here, since it's a real product gap, not just an internal fix-list
item.
