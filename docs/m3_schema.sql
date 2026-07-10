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

-- Reuses the shared trigger from m2_schema.sql section 1 — every other
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