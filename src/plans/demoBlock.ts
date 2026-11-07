import { localIsoDate } from '../lib/dates'
import type { TrainingBlock } from '../types'
import { loadTemplate, templateToBlock } from './templates'

export const DEMO_TEMPLATE_ID = 'tpl-4d-upper-lower-gym'
/** Completed cycles before the current block, so the demo holds about six months of history (QA 2026-11-07). */
export const DEMO_PAST_BLOCKS = 4
/** Past demo blocks reuse the template's id with this suffix; the approved Spanish texts are looked up without it. */
export const DEMO_PAST_SUFFIX = /~past-\d+$/

/** Monday of the current week, minus three weeks (local time). */
export function demoBlockStartDate(today: string = localIsoDate()) {
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const sinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - sinceMonday - 21)
  return localIsoDate(date)
}

function shiftDays(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  return localIsoDate(new Date(year, month - 1, day + days))
}

/** The current demo block plus the earlier completed cycles of the same PT template, oldest first. */
export async function loadDemoBlocks(today: string = localIsoDate()): Promise<TrainingBlock[]> {
  const template = await loadTemplate(DEMO_TEMPLATE_ID)
  const current = templateToBlock(template, demoBlockStartDate(today))
  const past = Array.from({ length: DEMO_PAST_BLOCKS }, (_, index) => {
    const cycle = DEMO_PAST_BLOCKS - index
    return {
      ...templateToBlock(template, shiftDays(current.startDate, -cycle * current.weeks * 7)),
      id: `${current.id}~past-${cycle}`,
    }
  })
  return [...past, current]
}
