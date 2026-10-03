-- Expandable, high-level explanations per training block (PT-authored).
-- Array of {"title": text, "body": text}; see docs/fitness/training-blocks-spec.md.
alter table public.training_blocks
  add column insights jsonb not null default '[]'::jsonb
  check (jsonb_typeof(insights) = 'array');
