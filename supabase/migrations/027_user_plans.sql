-- Personal 6-week plans (PO 2026-10-05): built from a PT template + the user's goals, personalised by AI
-- within PT rules, validated in the app. Users read and write only their own plans.
create table public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  template_id text not null check (template_id ~ '^tpl-[a-z0-9-]+$'),
  start_date date not null,
  block jsonb not null check (pg_column_size(block) < 200000),
  source text not null check (source in ('ai', 'rules')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index user_plans_one_active on public.user_plans (user_id) where active;
create index user_plans_user_created on public.user_plans (user_id, created_at desc);
alter table public.user_plans enable row level security;
create policy "Users manage own plans" on public.user_plans for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
