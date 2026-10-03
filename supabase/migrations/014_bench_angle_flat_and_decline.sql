-- Bench angles: 0 = flat, positive = incline (up to 90 = upright seat), negative = decline.
alter table public.training_block_exercises
  drop constraint if exists training_block_exercises_angle_degrees_check;
alter table public.training_block_exercises
  add constraint training_block_exercises_angle_degrees_check
  check (angle_degrees between -45 and 90);
