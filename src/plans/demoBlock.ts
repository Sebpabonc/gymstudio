import { localIsoDate } from '../lib/dates'
import type { TrainingBlock } from '../types'
import { loadTemplate, templateToBlock } from './templates'

export const DEMO_TEMPLATE_ID = 'tpl-4d-upper-lower-gym'

/** Monday of the current week, minus three weeks (local time). */
export function demoBlockStartDate(today: string = localIsoDate()) {
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const sinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - sinceMonday - 21)
  return localIsoDate(date)
}

export async function loadDemoBlocks(today: string = localIsoDate()): Promise<TrainingBlock[]> {
  const template = await loadTemplate(DEMO_TEMPLATE_ID)
  return [templateToBlock(template, demoBlockStartDate(today))]
}
