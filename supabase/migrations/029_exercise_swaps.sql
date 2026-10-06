-- Permanent exercise swaps per user (PO 2026-10-06): "always use X instead of Y" in current and future plans.
-- Today-only swaps stay on the device. Users read and write only their own swaps.
create table public.exercise_swaps (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_exercise_id text not null references public.exercises(id),
  to_exercise_id text not null references public.exercises(id),
  created_at timestamptz not null default now(),
  primary key (user_id, from_exercise_id),
  check (from_exercise_id <> to_exercise_id)
);
alter table public.exercise_swaps enable row level security;
create policy "Users manage own swaps" on public.exercise_swaps for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
