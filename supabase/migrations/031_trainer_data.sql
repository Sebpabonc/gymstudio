-- AI Trainer phase 2 (PO-approved plan 2026-10-07): keep what the plan asked for each logged exercise and
-- every recommendation the trainer showed, so recommendations can be rebuilt and evaluated from data.
alter table public.workout_entries
  add column target jsonb check (target is null or jsonb_typeof(target) = 'object');
comment on column public.workout_entries.target is
  'What was prescribed when this exercise was logged: {sets, reps:{min,max}, weight?, technique?, recommendationId?}.';

create table public.trainer_recommendations (
  id text primary key,                                   -- client-generated, stable across devices
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id),
  date date not null,
  block_id text,
  day_key text,
  original jsonb not null,                               -- {weight?, reps:{min,max}, sets}
  recommended jsonb not null,                            -- {weight?, reps:{min,max}, sets}
  action text not null check (action in ('increase_weight','increase_reps','maintain','decrease_weight','collect_data','deload','regress')),
  reason text not null,
  confidence text not null check (confidence in ('low','medium','high')),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'shown' check (status in ('shown','accepted','kept_original','ignored')),
  result_entry_id text,                                  -- workout_entries.id logged afterwards
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trainer_recommendations_user_exercise_idx on public.trainer_recommendations (user_id, exercise_id, date desc);
alter table public.trainer_recommendations enable row level security;
create policy "Users manage own recommendations" on public.trainer_recommendations for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
