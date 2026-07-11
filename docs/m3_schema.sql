-- Milestone 3 schema additions
-- Appended here as M3 tables land; see docs/m2_schema.sql for the M2 base.


-- 1. review_schedule
--    One row per (user, question): current SM-2 state
create table if not exists public.review_schedule (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id)  on delete cascade,
  question_id      uuid not null references public.questions(id) on delete cascade,
  ease_factor      real not null default 2.5,
  interval_days    int  not null default 0,
  repetitions      int  not null default 0,
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint review_schedule_user_question_unique unique (user_id, question_id),
  constraint review_schedule_ease_floor check (ease_factor >= 1.3)
);

create index if not exists review_schedule_due_idx
  on public.review_schedule(user_id, due_at);

-- Reuses the shared trigger from m2_schema.sql section 1 - every other
-- table with updated_at does the same.
drop trigger if exists review_schedule_set_updated_at on public.review_schedule;
create trigger review_schedule_set_updated_at
  before update on public.review_schedule
  for each row execute function public.set_updated_at();

alter table public.review_schedule enable row level security;

drop policy if exists "review_schedule_select_own" on public.review_schedule;
create policy "review_schedule_select_own"
  on public.review_schedule for select using (auth.uid() = user_id);

-- Insert needs the ownership check joined through questions -> topics ->
-- modules, same shape as every child-table policy in the M2 schema.
drop policy if exists "review_schedule_insert_own" on public.review_schedule;
create policy "review_schedule_insert_own"
  on public.review_schedule for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.questions q
      join public.topics  t on t.id = q.topic_id
      join public.modules m on m.id = t.module_id
      where q.id = review_schedule.question_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "review_schedule_update_own" on public.review_schedule;
create policy "review_schedule_update_own"
  on public.review_schedule for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "review_schedule_delete_own" on public.review_schedule;
create policy "review_schedule_delete_own"
  on public.review_schedule for delete using (auth.uid() = user_id);


-- 2. topic_prerequisites (concept graph edges)
--    An edge (topic_id, prerequisite_topic_id): topic_id requires prerequisite_topic_id first.
--    Cycles are rejected in app code (lib/prereq.ts) before the insert, since a check can't traverse
--    a graph and Postgres has no built-in "no cycles" constraint.
create table if not exists public.topic_prerequisites (
  id                     uuid primary key default gen_random_uuid(),
  topic_id               uuid not null references public.topics(id) on delete cascade,
  prerequisite_topic_id  uuid not null references public.topics(id) on delete cascade,
  created_at             timestamptz not null default now(),
  constraint topic_prereq_no_self check (topic_id <> prerequisite_topic_id),
  constraint topic_prereq_unique unique (topic_id, prerequisite_topic_id)
);

create index if not exists topic_prereq_topic_idx
  on public.topic_prerequisites(topic_id);
create index if not exists topic_prereq_prereq_idx
  on public.topic_prerequisites(prerequisite_topic_id);

-- Same-module enforcement. A CHECK can't join, so: trigger.
create or replace function public.topic_prereq_same_module()
returns trigger
language plpgsql
as $$
declare
  m1 uuid;
  m2 uuid;
begin
  select module_id into m1 from public.topics where id = new.topic_id;
  select module_id into m2 from public.topics where id = new.prerequisite_topic_id;
  if m1 is null or m2 is null or m1 <> m2 then
    raise exception 'prerequisite edges must connect topics in the same module';
  end if;
  return new;
end;
$$;

drop trigger if exists topic_prereq_same_module on public.topic_prerequisites;
create trigger topic_prereq_same_module
  before insert or update on public.topic_prerequisites
  for each row execute function public.topic_prereq_same_module();

alter table public.topic_prerequisites enable row level security;

-- Ownership flows through topic_id -> module -> user, same shape as
-- every other child-table policy in the M2/M3 schema.
drop policy if exists "topic_prereq_select_own" on public.topic_prerequisites;
create policy "topic_prereq_select_own"
  on public.topic_prerequisites for select
  using (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = topic_prerequisites.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "topic_prereq_insert_own" on public.topic_prerequisites;
create policy "topic_prereq_insert_own"
  on public.topic_prerequisites for insert
  with check (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = topic_prerequisites.topic_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "topic_prereq_delete_own" on public.topic_prerequisites;
create policy "topic_prereq_delete_own"
  on public.topic_prerequisites for delete
  using (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      where t.id = topic_prerequisites.topic_id and m.user_id = auth.uid()
    )
  );

-- 3. questions.source
--    Tags a question as hand-written or AI-generated. Defaults to
--    'manual' so no pre-existing or ordinary-insert row needs backfill.
alter table public.questions
  add column if not exists source text not null default 'manual'
  check (source in ('manual', 'ai'));

-- 4. ai_generation_log
--    One row per Gemini call attempt, enforcing a shared daily cap on
--    this deployment's single GEMINI_API_KEY. No user_id: the key is
--    shared, not owned, so RLS is "any signed-in user," not the usual chain.
create table if not exists public.ai_generation_log (
  id         uuid primary key default gen_random_uuid(),
  called_at  timestamptz not null default now()
);

-- Supports the "how many calls in the last 24h" query the cap check runs
-- on every generate click.
create index if not exists ai_generation_log_called_at_idx
  on public.ai_generation_log(called_at);

alter table public.ai_generation_log enable row level security;

drop policy if exists "ai_generation_log_select_signed_in" on public.ai_generation_log;
create policy "ai_generation_log_select_signed_in"
  on public.ai_generation_log for select
  using (auth.uid() is not null);

drop policy if exists "ai_generation_log_insert_signed_in" on public.ai_generation_log;
create policy "ai_generation_log_insert_signed_in"
  on public.ai_generation_log for insert
  with check (auth.uid() is not null);