create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  primary_muscle text not null,
  secondary_muscle text,
  notes text,
  aliases jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid references public.workout_programs(id) on delete set null,
  session_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  weight_kg numeric(6,2) not null default 0,
  reps integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_programs enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can view own exercises" on public.exercises
  for select using (auth.uid() = user_id);
create policy "Users can insert own exercises" on public.exercises
  for insert with check (auth.uid() = user_id);
create policy "Users can update own exercises" on public.exercises
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own exercises" on public.exercises
  for delete using (auth.uid() = user_id);
create policy "Users can view own programs" on public.workout_programs
  for select using (auth.uid() = user_id);
create policy "Users can insert own programs" on public.workout_programs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own programs" on public.workout_programs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own programs" on public.workout_programs
  for delete using (auth.uid() = user_id);
create policy "Users can view own sessions" on public.workout_sessions
  for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.workout_sessions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.workout_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own sessions" on public.workout_sessions
  for delete using (auth.uid() = user_id);
create policy "Users can view own sets" on public.workout_sets
  for select using (auth.uid() = user_id);
create policy "Users can insert own sets" on public.workout_sets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own sets" on public.workout_sets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own sets" on public.workout_sets
  for delete using (auth.uid() = user_id);
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
