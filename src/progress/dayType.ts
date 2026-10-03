import { TrainingBlock } from '../types'
import { ProgressEntry, DayType } from './types'
import { getDayType } from './utils'

export function dayTypeForEntry(entry: Pick<ProgressEntry, 'date' | 'dayKey'>, blocks: TrainingBlock[]): DayType | null {
  return getDayType(entry, blocks)
}
