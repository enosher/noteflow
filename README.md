# NoteFlow

![Apollo 11](https://img.shields.io/badge/Orbital-Apollo%2011-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black)

A web app that helps university students organise study materials by topic, track quiz performance, and get adaptive practice recommendations that target their weak areas.

**Live demo:** https://noteflow-liart.vercel.app

## Targeted Level of Achievement

Apollo 11

## Team

| Member | Role |
|--------|------|
| A      | Full-stack development, project setup, deployment |
| B      | Full-stack development, database design, documentation |

## Motivation

University students in NUS face a common but underappreciated problem during revision: their study materials are fragmented across too many different places.

Lecture slides are stored in LumiNUS or Canvas folders. Tutorial answers are buried in PDFs downloaded weeks ago. Personal summary notes are scattered across Notion, OneNote, or handwritten notebooks. Practicequestions are saved in random locations — some in past-year paper PDFs, some in self-made documents, some in online question banks.

When exam season arrives, students spend a significant portion of their revision time just *finding* the right materials rather than actually studying. They struggle to know what to revise next, often defaulting to topics they are already comfortable with while unknowingly neglecting their weak areas.

The result: revision becomes inefficient, stressful, and poorly targeted - exactly when focus and efficiency matter most.

Existing tools address parts of this problem but not all of it. Note-taking apps like Notion organise materials but have no quiz or performance tracking. Flashcard apps like Anki track performance but are disconnected from a student's own notes and materials. There is no single tool that connects a student's study materials, their quiz attempts, and their weak areas into one adaptive system.

NoteFlow is built to fill this gap.

## Aim

We aim to develop a web application that:

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

## Proposed Core Features

### 1. Module and Topic Organisation

Students create a module for each subject (e.g. CS2030, MA1521). Within each module, they create topics (e.g. Inheritance, Polymorphism) and subtopics (e.g. Method Overriding, Abstract Classes).

Under each subtopic, students can store:
- **Notes** — written summaries, lecture content, personal annotations
- **Practice questions** — with answers and difficulty ratings
- **Important links** — references, useful resources
- **Key formulas and summaries** — quick-reference content

The hierarchy (Module → Topic → Subtopic) mirrors how university subjects are structured, making it intuitive for students to organise and retrieve their materials.

### 2. Quiz Attempt Recording and Weak Topic Detection

When a student attempts a practice question, the system records:
- Whether the answer was correct or incorrect
- Time taken to answer
- The topic and subtopic the question belongs to

From this data, the system calculates accuracy per topic and identifies weak topics — defined as topics where accuracy falls below a threshold or where recent attempts show consistent mistakes.

Students can view a revision dashboard showing:
- Strong topics (high accuracy)
- Weak topics (low accuracy, flagged for revision)
- Progress over time (accuracy trends)

### 3. Adaptive Practice Recommendations

The recommendation system suggests practice questions based on four weighted factors:

1. **Weak topics** — topics with low accuracy are prioritised
2. **Recent mistakes** — questions answered incorrectly recently are 
   surfaced again
3. **Revision frequency** — topics not revised recently are boosted 
   (spaced repetition principle)
4. **Performance history** — overall accuracy trend influences weighting

The result is a personalised practice session that adapts to each student's current knowledge state, ensuring they spend more time on what they don't know and less time repeating what they already do.

## Proposed Extension Features

### 4. Adaptive Practice Generation
AI-assisted generation of new practice questions based on the student's notes and identified weak areas. Students can request additional questions for a specific topic without manually creating them.

### 5. Spaced Repetition Review
A scheduled review system that surfaces notes and questions at scientifically optimal intervals to maximise long-term retention. Based on the SM-2 spaced repetition algorithm.

### 6. Concept Graph and Prerequisite Mapping
A visual graph showing relationships between topics — for example, understanding Polymorphism requires first understanding Inheritance. The system uses this map to ensure students master prerequisites before moving to dependent topics.

### 7. Collaborative Study Groups
Students can share modules and question sets with classmates, enabling collaborative note-taking and shared practice question banks within a study group.

### 8. Study Analytics Dashboard
Advanced analytics showing study session patterns, time spent per topic, performance trends over weeks and months, and predicted readiness scores for upcoming assessments.

## System Design

### Architecture

![Architecture Diagram](docs/images/architecture.svg)

NoteFlow follows a three-tier architecture:
- **Frontend:** Next.js App Router with React Server Components and Tailwind CSS, deployed on Vercel
- **Backend:** Next.js API routes and Server Components handling logic
- **Database:** Supabase (PostgreSQL) for data storage, with Supabase Auth for authentication

### Page Flow

![Page Flow](docs/images/page-flow.svg)

- `/` — root page, redirects based on auth state
- `/signup` — new user registration
- `/login` — existing user authentication  
- `/dashboard` — protected, requires authentication

### Database Schema

The following tables are planned for Milestone 2 implementation:

**profiles** — extends Supabase auth.users
- `id` (UUID, primary key, references auth.users)
- `display_name` (text)
- `created_at` (timestamp)

**modules** — academic unit (e.g. CS2030)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → profiles)
- `code` (text, e.g. "CS2030")
- `name` (text, e.g. "Programming Methodology II")
- `description` (text, nullable)
- `created_at` (timestamp)

**topics** — within a module
- `id` (UUID, primary key)
- `module_id` (UUID, foreign key → modules)
- `name` (text)
- `description` (text)
- `order_index` (integer)
- `created_at` (timestamp)

**subtopics** — within a topic
- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key → topics)
- `name` (text)
- `order_index` (integer)
- `created_at` (timestamp)

**notes**
- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key → topics, nullable)
- `subtopic_id` (UUID, foreign key → subtopics, nullable)
- `title` (text)
- `content` (text, markdown)
- `file_url` (text, nullable)
- `created_at` (timestamp)

**questions**
- `id` (UUID, primary key)
- `topic_id` (UUID, foreign key → topics)
- `prompt` (text)
- `answer` (text)
- `question_type` (enum: mcq, short_answer, long_answer)
- `difficulty` (integer, 1–5)
- `created_at` (timestamp)

**quiz_attempts**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → profiles)
- `question_id` (UUID, foreign key → questions)
- `is_correct` (boolean)
- `time_taken_ms` (integer)
- `attempted_at` (timestamp)

## Tech Stack

| Technology | Purpose | Why we chose it |
|---|---|---|
| Next.js 16 | Web framework | App Router enables server components and file-based routing. Seamless Vercel deployment. |
| TypeScript | Language | Type safety catches bugs at write-time. Familiar to team members with C++ background. |
| Tailwind CSS | Styling | Utility classes allow fast UI iteration without writing custom CSS files. |
| Supabase | Backend | Provides PostgreSQL, authentication, and file storage in one platform. Free tier is generous. Singapore region minimises latency. |
| PostgreSQL | Database | Relational model suits NoteFlow's hierarchical data (modules → topics → subtopics). |
| Vercel | Deployment | Zero-config deployment for Next.js. Auto-deploys on every push to main. Preview URLs on every PR. |

## Development Plan

### Milestone 2 — Prototype (due 29 June)
- Module and topic CRUD (create, read, update, delete)
- Note and question storage per topic
- Quiz attempt recording
- Basic revision dashboard showing performance by topic
- Weak topic detection based on accuracy history
- System testing

### Milestone 3 — Extension (due 27 July)
- Adaptive practice recommendations weighted by weak areas and recency
- Spaced repetition review scheduling
- Concept graph showing topic prerequisites
- User testing with NUS students
- Performance optimisation
- Final documentation

## Software Engineering Practices

### Version Control
- Feature branch workflow — all changes made on separate branches, never directly on main
- Pull requests required for all merges — branch protection enforced on main
- Minimum 1 approving review required before merge
- Squash and merge to keep main history clean
- Conventional commit messages: `feat:`, `fix:`, `docs:`, `chore:`

### Code Quality
- ESLint for static analysis
- Prettier for consistent formatting (format on save enabled)
- TypeScript strict mode for type safety

### Project Management
- Project log tracking hours per person per task
- Weekly sync calls to align on progress
- GitHub Issues for bug tracking

## Technical Proof of Concept

We built a working authentication flow deployed at https://noteflow-liart.vercel.app

### Signup
![Signup](docs/images/poc-signup.png)

### Login
![Login](docs/images/poc-login.png)

### Dashboard
![Dashboard](docs/images/poc-dashboard.png)

### Logout
![After logout](docs/images/poc-logout.png)
*Logging out redirects the user back to the login page.*

The POC demonstrates end-to-end integration between Next.js and Supabase Auth, with session persistence across browser refreshes and protected route redirection via middleware.

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

4. Run the development server:
```bash
   npm run dev
```

5. Open http://localhost:3000

## Known Limitations

- Email confirmation is disabled in Supabase for development simplicity. Will be re-enabled before production.
- No password reset flow implemented yet.
- No input validation beyond HTML `required` and `minLength` attributes.
- Error messages from Supabase are displayed as-is without user-friendly formatting.
- No rate limiting on auth endpoints.

## Acknowledgements

- Adviser: Rajakumar Niranjana
- NUS Orbital 2026 organising team