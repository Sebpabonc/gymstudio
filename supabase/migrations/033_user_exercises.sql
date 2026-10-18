-- User-created ("Yours") exercises, PO 2026-10-18 (docs/ux/proposals/2026-10-18-simple-find-and-create.md §5).
-- Until now a custom exercise lived only on the phone, and its logs could not sync because
-- workout_entries.exercise_id must reference the approved catalogue (public.exercises).
--
-- Design (Tech Lead):
-- * One row per user exercise; the id is client-generated once at creation and never changes
--   (history references it). The key is (user_id, id) so two users can never collide.
-- * workout_entries gets a second, optional reference user_exercise_id. Exactly one of
--   exercise_id (catalogue) or user_exercise_id (own exercise) is set. The composite foreign key
--   includes user_id, so an entry can only point at an exercise owned by the same user.
-- * Additive only: every existing row keeps exercise_id and passes the new check.

create table public.user_exercises (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(id) between 1 and 80),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  body_region text not null
    check (body_region in ('Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full Body', 'Other')),
  equipment text
    check (equipment in ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other')),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,                      -- soft delete so deletions sync too
  primary key (user_id, id)
);

create index user_exercises_user_updated_idx on public.user_exercises (user_id, updated_at);

alter table public.user_exercises enable row level security;

create policy "Users read own exercises"
  on public.user_exercises for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own exercises"
  on public.user_exercises for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own exercises"
  on public.user_exercises for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger user_exercises_touch_updated_at
  before update on public.user_exercises
  for each row execute function public.touch_updated_at();

-- Logs of an own exercise reference it instead of the catalogue.
alter table public.workout_entries
  alter column exercise_id drop not null,
  add column user_exercise_id text,
  add constraint workout_entries_user_exercise_fkey
    foreign key (user_id, user_exercise_id) references public.user_exercises (user_id, id) on delete restrict,
  add constraint workout_entries_one_exercise_ref
    check (num_nonnulls(exercise_id, user_exercise_id) = 1);

create index workout_entries_user_exercise_idx
  on public.workout_entries (user_id, user_exercise_id)
  where user_exercise_id is not null;
