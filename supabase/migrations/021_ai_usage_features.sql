-- AI Phase 1: allow the two new gateway features in the usage ledger.
alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('ask_exercise', 'explain_suggestion', 'session_summary'));
