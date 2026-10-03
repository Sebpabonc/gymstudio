-- Cloud copy of each user's workout history, used to sync the offline-first app.
-- One row = one logged exercise on one date (same shape as the app's WorkoutEntry).
-- Sets are stored as jsonb [{reps, weight}] so a logged exercise syncs atomically;
-- see docs/architecture/auth-and-sync.md for why this table is used instead of the
-- unused normalized workout_sessions / workout_sets tables from 001_init.

create table public.workout_entries (
  id text primary key,                         -- client-generated id (stable across devices)
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  date date not null,
  sets jsonb not null check (jsonb_typeof(sets) = 'array'),
  notes text,
  block_id text references public.training_blocks(id) on delete set null,
  day_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                       -- soft delete so deletions sync too
);

create index workout_entries_user_updated_idx on public.workout_entries (user_id, updated_at);
create index workout_entries_user_exercise_date_idx on public.workout_entries (user_id, exercise_id, date desc);

alter table public.workout_entries enable row level security;

-- Each user can only see and change their own rows.
create policy "Users read own workout entries"
  on public.workout_entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own workout entries"
  on public.workout_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own workout entries"
  on public.workout_entries for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Keep updated_at honest regardless of what the client sends.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger workout_entries_touch_updated_at
  before update on public.workout_entries
  for each row execute function public.touch_updated_at();
