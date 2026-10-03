-- Catalogue v2: taxonomy, two muscle columns and 5 posture tips per exercise.
-- See docs/fitness/catalogue-v2-spec.md. Additive only: no data is removed.

alter table public.exercises
  add column body_region text check (body_region in
    ('Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Full Body')),
  add column primary_muscles text[] not null default '{}',
  add column mechanic text check (mechanic in ('compound', 'isolation')),
  add column laterality text check (laterality in ('bilateral', 'unilateral')),
  -- Spanish posture cues, in order: start position, alignment, execution, common mistake, safety.
  add column posture_tips text[] not null default '{}'
    check (cardinality(posture_tips) in (0, 5));

comment on column public.exercises.primary_muscle is
  'Deprecated: first of primary_muscles, kept for app versions that read it.';

-- Wider vocabularies for v2.
alter table public.exercises drop constraint if exists exercises_equipment_check;
alter table public.exercises add constraint exercises_equipment_check check (equipment in
  ('barbell', 'dumbbell', 'cable', 'machine', 'plate-loaded', 'smith-machine', 'bodyweight',
   'ez-bar', 'hex-bar', 'kettlebell', 'band'));

alter table public.exercises drop constraint if exists exercises_movement_pattern_check;
alter table public.exercises add constraint exercises_movement_pattern_check check (movement_pattern in
  ('push horizontal', 'push vertical', 'pull horizontal', 'pull vertical',
   'squat', 'hinge', 'lunge', 'isolation', 'core', 'carry'));
