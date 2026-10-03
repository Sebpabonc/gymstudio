-- Sync correctness: updated_at must always be server time, also on INSERT.
-- Otherwise an entry logged offline and uploaded days later keeps its old client
-- timestamp, and devices that already pulled past that time would never receive it.
drop trigger if exists workout_entries_touch_updated_at on public.workout_entries;
create trigger workout_entries_touch_updated_at
  before insert or update on public.workout_entries
  for each row execute function public.touch_updated_at();
