-- Supabase security advisors (2026-10-18):
-- 1) handle_new_user() (auth trigger) and rls_auto_enable() (event trigger) are SECURITY DEFINER and were
--    callable through /rest/v1/rpc by anon/authenticated. Triggers do not need EXECUTE for API roles, so revoke it.
-- 2) handle_new_user() had a mutable search_path; pin it and schema-qualify (it already uses public.profiles).
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
