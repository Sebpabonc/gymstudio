-- AI help button (PO 2026-10-05): in-app feedback + general AI chat feature.
create table public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('problem', 'idea', 'content', 'other')),
  message text not null check (char_length(message) between 1 and 1000),
  app_version text,
  screen text,
  language text check (language in ('en', 'es')),
  created_at timestamptz not null default now()
);
create index feedback_created_idx on public.feedback (created_at desc);
alter table public.feedback enable row level security;
create policy "Users send feedback" on public.feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users read own feedback" on public.feedback for select to authenticated
  using ((select auth.uid()) = user_id);

alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('ask_exercise', 'explain_suggestion', 'session_summary', 'general_chat'));
