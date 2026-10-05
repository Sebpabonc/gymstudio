-- AI coach loop (PO 2026-10-05): automatic per-exercise feedback + next-session plan.
alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('ask_exercise', 'explain_suggestion', 'session_summary', 'general_chat', 'exercise_feedback', 'next_session_plan'));
