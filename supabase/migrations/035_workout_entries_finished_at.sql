-- PO 2026-11-09: tapping "Finish workout" counts the plan day as complete for the week, even with
-- exercises left. The finish time is stored on that session's logged entries so every device agrees.
-- Nullable, no default: adding it is metadata-only and older app builds simply never send it.
alter table public.workout_entries
  add column finished_at timestamptz;
comment on column public.workout_entries.finished_at is
  'When the user finished this plan-day session with "Finish workout"; the day then counts as complete for that week.';
