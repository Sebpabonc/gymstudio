-- Training blocks: 6-week programs curated by the product owner (PT-authored, approved).
-- Global, read-only reference data like public.exercises. Spec: docs/fitness/training-blocks-spec.md

create table public.training_blocks (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  number integer not null unique check (number > 0),
  name text not null,
  method text not null,
  start_date date not null,
  weeks integer not null default 6 check (weeks > 0),
  origin text not null check (origin in ('coach', 'pt')),
  summary text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_block_days (
  block_id text not null references public.training_blocks(id) on delete cascade,
  key text not null check (key in
    ('chest-back-a', 'arms-a', 'lower-body-a', 'chest-back-b', 'arms-b', 'lower-body-b')),
  position integer not null check (position between 1 and 6),
  name text not null,
  focus text,
  primary key (block_id, key)
);

create table public.training_block_exercises (
  block_id text not null,
  day_key text not null,
  code text not null check (code ~ '^[A-H][1-3]$'),
  position integer not null,
  exercise_id text not null references public.exercises(id) on delete restrict,
  sets integer not null check (sets > 0),
  reps text[] not null check (cardinality(reps) > 0),
  rest_seconds integer not null check (rest_seconds >= 0),
  technique text not null check (technique in
    ('straight', 'superset', 'drop-set', 'pyramid', 'reverse-pyramid')),
  angle_degrees integer check (angle_degrees > 0 and angle_degrees < 90),
  notes text,
  primary key (block_id, day_key, code),
  foreign key (block_id, day_key) references public.training_block_days(block_id, key) on delete cascade
);

alter table public.training_blocks enable row level security;
alter table public.training_block_days enable row level security;
alter table public.training_block_exercises enable row level security;

-- Readable by everyone; no write policies (only migrations / service role change them).
create policy "Training blocks are readable by everyone"
  on public.training_blocks for select to anon, authenticated using (true);
create policy "Training block days are readable by everyone"
  on public.training_block_days for select to anon, authenticated using (true);
create policy "Training block exercises are readable by everyone"
  on public.training_block_exercises for select to anon, authenticated using (true);
