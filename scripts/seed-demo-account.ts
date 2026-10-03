/**
 * Generates SQL that loads ~6 months of demo workouts into ONE existing account's
 * cloud history (public.workout_entries), e.g. the "PT demo" profile.
 *
 * Usage (Tech Lead, never in CI):
 *   DEMO_USER_ID=<auth.users.id> npx vite-node scripts/seed-demo-account.ts > /tmp/seed.sql
 *   supabase db query --linked -f /tmp/seed.sql
 *
 * Rows use ids prefixed with "pt-demo-" and ON CONFLICT DO NOTHING, so re-running is safe.
 * The account must already exist (created in the Supabase dashboard).
 */
import blockRows from '../docs/fitness/approved/training-blocks/blocks.json'
import { generateDemoHistory } from '../src/demo/generateDemoHistory'
import { localIsoDate } from '../src/lib/dates'
import { mapTrainingBlockRows } from '../src/utils/storage'

const userId = process.env.DEMO_USER_ID ?? ''
if (!/^[0-9a-f-]{36}$/.test(userId)) {
  console.error('Set DEMO_USER_ID to the account uuid from auth.users')
  process.exit(1)
}

const sql = (value: string | null | undefined) =>
  value === null || value === undefined ? 'null' : `'${value.replace(/'/g, "''")}'`

const blocks = mapTrainingBlockRows(blockRows as unknown[])
const entries = generateDemoHistory({ blocks, endDate: localIsoDate(), months: 6, seed: 7 })

const values = entries.map((entry) =>
  `(${sql(`pt-demo-${entry.id}`)}, ${sql(userId)}, ${sql(entry.exerciseId)}, ${sql(entry.date)}, ` +
  `${sql(JSON.stringify(entry.sets))}::jsonb, ${sql(entry.notes ?? null)}, ` +
  `${sql(entry.blockId ?? null)}, ${sql(entry.dayKey ?? null)})`
)

console.log(`-- ${entries.length} demo workout entries for ${userId}`)
console.log('insert into public.workout_entries (id, user_id, exercise_id, date, sets, notes, block_id, day_key) values')
console.log(values.join(',\n'))
console.log('on conflict (id) do nothing;')
