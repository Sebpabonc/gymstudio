-- Personal profile (PO 2026-10-05): body measurements log + training goal intake, per user.
create table public.body_metrics (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5, 1) check (weight_kg between 25 and 350),
  steps integer check (steps between 0 and 100000),
  calories integer check (calories between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table public.body_metrics enable row level security;
create policy "Users manage own metrics" on public.body_metrics for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.training_goals (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  goal text not null check (goal in ('muscle', 'fat_loss', 'strength', 'general')),
  days_per_week smallint not null check (days_per_week between 3 and 6),
  experience text not null check (experience in ('beginner', 'intermediate', 'advanced')),
  activity_level text not null check (activity_level in ('low', 'moderate', 'high')),
  session_minutes smallint not null check (session_minutes in (45, 60, 75, 90)),
  equipment text not null check (equipment in ('full_gym', 'basic_gym', 'home')),
  notes text check (char_length(notes) <= 500),
  updated_at timestamptz not null default now()
);
alter table public.training_goals enable row level security;
create policy "Users manage own goals" on public.training_goals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
