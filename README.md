## System Design

### Architecture

![Architecture Diagram](docs/images/architecture diagram.svg)

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

**modules** — top-level academic unit (e.g. CS2030)
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