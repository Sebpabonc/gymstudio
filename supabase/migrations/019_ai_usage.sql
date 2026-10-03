-- AI gateway usage ledger: one row per model call made by the ai-gateway Edge Function.
-- Used for the per-user daily limit and the global monthly spend cap (PO budget: USD 20/month).
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('ask_exercise')),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index ai_usage_created_idx on public.ai_usage (created_at);
create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at);

alter table public.ai_usage enable row level security;

-- Users can see their own usage (e.g. "3 of 20 questions left today").
-- No insert/update/delete policies: only the Edge Function (service role) writes here.
create policy "Users read own AI usage"
  on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.ai_usage from anon, authenticated;
