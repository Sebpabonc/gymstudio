import type { LiftVerdict } from './types'

export type ProgressStatus = 'building' | 'progressing' | 'holding' | 'dipping'

export type LiftStatusCount = {
  improving: number
  held: number
  lower: number
  eligible: number
}

export function overallProgressStatus(verdicts: LiftVerdict[]) {
  const counts: LiftStatusCount = {
    improving: verdicts.filter((verdict) => verdict === 'improving').length,
    held: verdicts.filter((verdict) => verdict === 'held').length,
    lower: verdicts.filter((verdict) => verdict === 'lower').length,
    eligible: verdicts.filter((verdict) => verdict !== 'not-enough-data').length,
  }
  const status: ProgressStatus = counts.eligible < 2
    ? 'building'
    : counts.improving >= counts.eligible / 2 && counts.improving > counts.lower
      ? 'progressing'
      : counts.lower > counts.improving ? 'dipping' : 'holding'
  return { status, counts }
}
