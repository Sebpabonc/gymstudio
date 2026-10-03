-- Exercise catalogue becomes global reference data (one shared list, controlled by
-- the product owner), replacing the per-user `exercises` table from 001_init.
-- The old table is kept, renamed, so nothing is deleted.

alter table public.exercises rename to user_exercises_legacy;
comment on table public.user_exercises_legacy is
  'Archived per-user exercise table from 001_init. Superseded by public.exercises (global catalogue).';

alter table public.workout_sets drop constraint if exists workout_sets_exercise_id_fkey;

create table public.exercises (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_es text not null,
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment text not null check (equipment in
    ('barbell', 'dumbbell', 'cable', 'machine', 'plate-loaded', 'bodyweight', 'ez-bar', 'hex-bar')),
  movement_pattern text not null check (movement_pattern in
    ('push horizontal', 'push vertical', 'pull horizontal', 'pull vertical',
     'squat', 'hinge', 'lunge', 'isolation', 'core')),
  -- Old ids that now resolve to this exercise (history written with them must still match).
  aliases text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.exercises is
  'Global exercise catalogue. Source: docs/fitness/approved. Read-only for app users.';

alter table public.exercises enable row level security;

-- Everyone (signed in or not) can read the catalogue. There are deliberately no
-- insert/update/delete policies: only migrations / the service role can change it.
create policy "Exercise catalogue is readable by everyone"
  on public.exercises for select
  to anon, authenticated
  using (true);

-- Logged sets reference the catalogue by its stable text id (existing values are kept).
alter table public.workout_sets
  alter column exercise_id type text using exercise_id::text;
alter table public.workout_sets
  add constraint workout_sets_exercise_id_fkey
  foreign key (exercise_id) references public.exercises(id) on delete restrict;
