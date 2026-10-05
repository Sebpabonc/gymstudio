-- PO 2026-10-05: blocks 1-9 are Sebas's private program, visible only under his profile.
-- Other users follow their own plan (user_plans); demo mode uses a bundled PT template.
alter table public.training_blocks
  add column owner_id uuid references auth.users(id) on delete cascade;

update public.training_blocks set owner_id = '44b10d1d-b2db-445f-aa93-9c9793c75a3b';

drop policy "Training blocks are readable by everyone" on public.training_blocks;
drop policy "Training block days are readable by everyone" on public.training_block_days;
drop policy "Training block exercises are readable by everyone" on public.training_block_exercises;

create policy "Owners read their blocks" on public.training_blocks for select to authenticated
  using (owner_id = (select auth.uid()));
create policy "Owners read their block days" on public.training_block_days for select to authenticated
  using (exists (select 1 from public.training_blocks b where b.id = block_id and b.owner_id = (select auth.uid())));
create policy "Owners read their block exercises" on public.training_block_exercises for select to authenticated
  using (exists (select 1 from public.training_blocks b where b.id = block_id and b.owner_id = (select auth.uid())));
