-- NoteFlow — Milestone 2 schema


-- 0. Extensions
-- -------------------------------------------------------------
-- gen_random_uuid() lives in pgcrypto (already enabled on Supabase
-- by default, but harmless to assert).
create extension if not exists pgcrypto;

-- 1. Shared trigger function for updated_at
-- -------------------------------------------------------------
-- One function, reused as a BEFORE UPDATE trigger on every table that
-- has updated_at. Avoids repeating the same three-line function six
-- times — quiz_attempts is the only table that skips this, since
-- attempts are immutable (see section 8).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 2. profiles
--    Extends auth.users. Row created via a trigger on signup.
-- -------------------------------------------------------------
-- profiles exists separately from auth.users because auth.users is
-- managed by Supabase Auth and we dont want app data living there.
-- Every other table's ownership chain (modules.user_id -> profiles.id)
-- ultimately ties back to this table rather than auth.users directly,
-- so RLS policies don't need to reach into the auth schema.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth.users row is inserted.
-- security definer is required here: this trigger fires during signup,
-- before the new user has a session, so it needs to run with elevated
-- privilege to insert into public.profiles on their behalf. Without
-- this, every new signup would 500 because no profiles row exists yet
-- for any of the FK constraints elsewhere in the schema to reference.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. modules
-- -------------------------------------------------------------
-- Top of the hierarchy (Module -> Topic -> Subtopic). Every other
-- table's RLS policy eventually joins back up to modules.user_id —
-- this is the single source of truth for "do you own this row."
create table if not exists public.modules (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  code         text not null,
  name         text not null,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Every ownership-check policy filters on user_id, so this index keeps
-- "show me my modules" (and every nested RLS join under it) fast.
create index if not exists modules_user_id_idx on public.modules(user_id);

drop trigger if exists modules_set_updated_at on public.modules;
create trigger modules_set_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

-- 4. topics
-- -------------------------------------------------------------
create table if not exists public.topics (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references public.modules(id) on delete cascade,
  name         text not null,
  description  text,
  -- Reserved for manual drag-to-reorder; not used by any M2 UI yet
  -- (every insert sets this to 0 — see createTopic in
  -- app/modules/[id]/topics/new/actions.ts).
  order_index  int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists topics_module_id_idx on public.topics(module_id);

drop trigger if exists topics_set_updated_at on public.topics;
create trigger topics_set_updated_at
  before update on public.topics
  for each row execute function public.set_updated_at();

-- 5. subtopics
-- -------------------------------------------------------------
create table if not exists public.subtopics (
  id           uuid primary key default gen_random_uuid(),
  topic_id     uuid not null references public.topics(id) on delete cascade,
  name         text not null,
  order_index  int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists subtopics_topic_id_idx on public.subtopics(topic_id);

drop trigger if exists subtopics_set_updated_at on public.subtopics;
create trigger subtopics_set_updated_at
  before update on public.subtopics
  for each row execute function public.set_updated_at();

-- 6. notes
--    Must be attached to only exactly 1 of topic / subtopic.
-- -------------------------------------------------------------
-- Notes can hang off a topic directly or a subtopic, never both and
-- never neither — a note about "Method Overriding" (a subtopic)
-- shouldn't also dangle off "Inheritance" (its parent topic). The
-- check constraint below enforces this at the DB level so it's
-- impossible to violate even if the app-layer validation in
-- createNote() has a bug. (topic_id is null) <> (subtopic_id is null)
-- is a compact XOR: true only when exactly one side is null.
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  topic_id     uuid references public.topics(id) on delete cascade,
  subtopic_id  uuid references public.subtopics(id) on delete cascade,
  title        text not null,
  content      text,                -- markdown body, rendered client-side via react-markdown
  file_url     text,                -- storage path, NOT a public URL — bucket is private,
                                     -- see lib/storage.ts getSignedNoteFileUrl()
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint notes_exactly_one_parent
    check ((topic_id is null) <> (subtopic_id is null))
);

create index if not exists notes_topic_id_idx    on public.notes(topic_id);
create index if not exists notes_subtopic_id_idx on public.notes(subtopic_id);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- 7. questions
--    Always attached to a topic. Optionally narrowed to a subtopic.
-- -------------------------------------------------------------
-- Unlike notes, questions always have topic_id set — subtopic_id is
-- an optional narrowing, not an alternative parent. This matters for
-- the recommender (lib/recommender.ts), which groups questions by
-- topic_id for weak-topic scoring regardless of whether a subtopic is also set.
create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references public.topics(id)    on delete cascade,
  subtopic_id    uuid references public.subtopics(id) on delete cascade,
  prompt         text not null,
  answer         text not null,
  options        jsonb,           -- MCQ choices, e.g. ["A) ...","B) ..."]; null for non-MCQ
  question_type  text not null check (question_type in ('mcq','short_answer','long_answer')),
  difficulty     int  not null check (difficulty between 1 and 5),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- MCQ questions are meaningless without options to choose from;
  -- this stops a malformed insert before it ever reaches the quiz UI.
  -- jsonb_typeof check guards against someone passing a JSON object
  -- or string into what should be an array.
  constraint questions_mcq_has_options
    check (
      question_type <> 'mcq'
      or (options is not null and jsonb_typeof(options) = 'array')
    )
);

create index if not exists questions_topic_id_idx    on public.questions(topic_id);
create index if not exists questions_subtopic_id_idx on public.questions(subtopic_id);

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- Trigger: if subtopic_id is set, it must belong to the same topic.
-- A plain CHECK constraint can't reference another table, so this is
-- the only way to enforce "subtopic_id, if present, must actually be
-- a child of topic_id" — e.g. block a question claiming topic_id =
-- Inheritance but subtopic_id = some subtopic that actually belongs
-- to Polymorphism.
create or replace function public.questions_check_subtopic_parent()
returns trigger
language plpgsql
as $$
declare
  parent_topic uuid;
begin
  if new.subtopic_id is null then
    return new;
  end if;
  select topic_id into parent_topic
    from public.subtopics
    where id = new.subtopic_id;
  if parent_topic is null or parent_topic <> new.topic_id then
    raise exception
      'subtopic_id % does not belong to topic_id %', new.subtopic_id, new.topic_id;
  end if;
  return new;
end;
$$;

drop trigger if exists questions_check_subtopic_parent on public.questions;
create trigger questions_check_subtopic_parent
  before insert or update on public.questions
  for each row execute function public.questions_check_subtopic_parent();

-- 8. quiz_attempts (immutable — no updated_at)
-- -------------------------------------------------------------
-- Deliberately no updated_at column and no update RLS policy below:
-- an attempt is a historical record of what happened at attempt time.
-- Letting it be edited after the fact would let a user retroactively
-- "fix" a wrong answer and corrupt their own accuracy stats — the
-- whole point of weak-topic detection depends on this data being
-- append-only.
create table if not exists public.quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id)  on delete cascade,
  question_id    uuid not null references public.questions(id) on delete cascade,
  user_answer    text,
  is_correct     boolean not null,
  time_taken_ms  int,
  attempted_at   timestamptz not null default now()
);

create index if not exists quiz_attempts_user_id_idx       on public.quiz_attempts(user_id);
create index if not exists quiz_attempts_question_id_idx   on public.quiz_attempts(question_id);
-- Composite index matches the access pattern in lib/recommender.ts —
-- "most recent attempts for this user, newest first" — rather than
-- relying on two separate single-column indexes.
create index if not exists quiz_attempts_user_attempted_idx
  on public.quiz_attempts(user_id, attempted_at desc);

-- 9. Row Level Security
-- -------------------------------------------------------------
-- Plan :
--   Every table has RLS enabled.
--   Ownership flows from modules.user_id. Child rows (topics,
--    subtopics, notes, questions) check ownership by joining
--    back to modules.
--   quiz_attempts owns user_id directly.
--   profiles: a user can read & update their own row only.
--
-- Why chose join-based ownership instead of having user_id on
-- every table: it would be faster to check, but it'd duplicate the
-- ownership data in six places and risk drift if a row's parent ever
-- changed. At NoteFlow's scale, the join cost is negligible and
-- there's exactly one source of truth for "who owns this module."

alter table public.profiles      enable row level security;
alter table public.modules       enable row level security;
alter table public.topics        enable row level security;
alter table public.subtopics     enable row level security;
alter table public.notes         enable row level security;
alter table public.questions     enable row level security;
alter table public.quiz_attempts enable row level security;

-- ---- profiles ------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy needed: rows are created by the
-- handle_new_user() trigger which runs as security definer.

-- ---- modules -------------------------------------------------
drop policy if exists "modules_select_own" on public.modules;
create policy "modules_select_own"
  on public.modules for select
  using (auth.uid() = user_id);

drop policy if exists "modules_insert_own" on public.modules;
create policy "modules_insert_own"
  on public.modules for insert
  with check (auth.uid() = user_id);

drop policy if exists "modules_update_own" on public.modules;
create policy "modules_update_own"
  on public.modules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "modules_delete_own" on public.modules;
create policy "modules_delete_own"
  on public.modules for delete
  using (auth.uid() = user_id);

-- ---- topics --------------------------------------------------
-- Helper logic (not a literal SQL function — repeated inline in every
-- policy below): a topic is "yours" if its module belongs to you.
-- Postgres RLS policies can't share a subquery across policies
-- directly, so this exists-clause is duplicated for select/insert/
-- update/delete rather than factored out — a small amount of
-- repetition in exchange for each policy being independently readable.
drop policy if exists "topics_select_own" on public.topics;
create policy "topics_select_own"
  on public.topics for select
  using (
    exists (
      select 1 from public.modules m
      where m.id = topics.module_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "topics_insert_own" on public.topics;
create policy "topics_insert_own"
  on public.topics for insert
  with check (
    exists (
      select 1 from public.modules m
      where m.id = topics.module_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "topics_update_own" on public.topics;
create policy "topics_update_own"
  on public.topics for update
  using (
    exists (
      select 1 from public.modules m
      where m.id = topics.module_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.modules m
      where m.id = topics.module_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "topics_delete_own" on public.topics;
create policy "topics_delete_own"
  on public.topics for delete
  using (
    exists (
      select 1 from public.modules m
      where m.id = topics.module_id and m.user_id = auth.uid()
    )
  );

-- ---- subtopics ----------------------------------------------
-- One join deeper than topics: subtopic -> topic -> module -> user.
drop policy if exists "subtopics_select_own" on public.subtopics;
create policy "subtopics_select_own"
  on public.subtopics for select
  using (
    exists (
      select 1
      from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = subtopics.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "subtopics_insert_own" on public.subtopics;
create policy "subtopics_insert_own"
  on public.subtopics for insert
  with check (
    exists (
      select 1
      from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = subtopics.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "subtopics_update_own" on public.subtopics;
create policy "subtopics_update_own"
  on public.subtopics for update
  using (
    exists (
      select 1
      from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = subtopics.topic_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = subtopics.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "subtopics_delete_own" on public.subtopics;
create policy "subtopics_delete_own"
  on public.subtopics for delete
  using (
    exists (
      select 1
      from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = subtopics.topic_id and m.user_id = auth.uid()
    )
  );

-- ---- notes ---------------------------------------------------
-- A note is yours if its (topic_id OR subtopic_id) leads back to you.
-- Because notes can hang off either parent (see the XOR constraint in
-- section 6), every notes policy needs both branches of the OR —
-- there's no single join path that covers both cases at once.
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select
  using (
    (topic_id is not null and exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = notes.topic_id and m.user_id = auth.uid()
    ))
    or
    (subtopic_id is not null and exists (
      select 1 from public.subtopics s
      join public.topics  t on t.id = s.topic_id
      join public.modules m on m.id = t.module_id
      where s.id = notes.subtopic_id and m.user_id = auth.uid()
    ))
  );

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  with check (
    (topic_id is not null and exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = notes.topic_id and m.user_id = auth.uid()
    ))
    or
    (subtopic_id is not null and exists (
      select 1 from public.subtopics s
      join public.topics  t on t.id = s.topic_id
      join public.modules m on m.id = t.module_id
      where s.id = notes.subtopic_id and m.user_id = auth.uid()
    ))
  );

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  using (
    (topic_id is not null and exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = notes.topic_id and m.user_id = auth.uid()
    ))
    or
    (subtopic_id is not null and exists (
      select 1 from public.subtopics s
      join public.topics  t on t.id = s.topic_id
      join public.modules m on m.id = t.module_id
      where s.id = notes.subtopic_id and m.user_id = auth.uid()
    ))
  )
  with check (
    (topic_id is not null and exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = notes.topic_id and m.user_id = auth.uid()
    ))
    or
    (subtopic_id is not null and exists (
      select 1 from public.subtopics s
      join public.topics  t on t.id = s.topic_id
      join public.modules m on m.id = t.module_id
      where s.id = notes.subtopic_id and m.user_id = auth.uid()
    ))
  );

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete
  using (
    (topic_id is not null and exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = notes.topic_id and m.user_id = auth.uid()
    ))
    or
    (subtopic_id is not null and exists (
      select 1 from public.subtopics s
      join public.topics  t on t.id = s.topic_id
      join public.modules m on m.id = t.module_id
      where s.id = notes.subtopic_id and m.user_id = auth.uid()
    ))
  );

-- ---- questions ----------------------------------------------
-- Simpler than notes: topic_id is always set on questions, so there's
-- only one join path to check, not two.
drop policy if exists "questions_select_own" on public.questions;
create policy "questions_select_own"
  on public.questions for select
  using (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = questions.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "questions_insert_own" on public.questions;
create policy "questions_insert_own"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = questions.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "questions_update_own" on public.questions;
create policy "questions_update_own"
  on public.questions for update
  using (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = questions.topic_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = questions.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "questions_delete_own" on public.questions;
create policy "questions_delete_own"
  on public.questions for delete
  using (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = questions.topic_id and m.user_id = auth.uid()
    )
  );

-- ---- quiz_attempts ------------------------------------------
-- user_id is on the row directly — no join needed for select/delete.
-- insert is stricter than the others: it checks BOTH that you're
-- inserting as yourself AND that the question you're attempting is
-- actually one you have access to (via the same module-ownership
-- chain as questions above). Without the second check, a user could
-- spoof an attempt on a question_id belonging to someone else's
-- private module just by guessing/enumerating a UUID.
drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "quiz_attempts_insert_own" on public.quiz_attempts;
create policy "quiz_attempts_insert_own"
  on public.quiz_attempts for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.questions q
      join public.topics  t on t.id = q.topic_id
      join public.modules m on m.id = t.module_id
      where q.id = quiz_attempts.question_id and m.user_id = auth.uid()
    )
  );

-- No update policy: attempts are immutable (see section 8 comment).
-- Delete is still allowed — e.g. a user might want to clear bad test
-- data without it permanently skewing their accuracy stats forever.
drop policy if exists "quiz_attempts_delete_own" on public.quiz_attempts;
create policy "quiz_attempts_delete_own"
  on public.quiz_attempts for delete
  using (auth.uid() = user_id);

-- =============================================================
-- The End.
