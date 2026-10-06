import { formatNumber } from '../i18n/format'
import type { Language, Translate, TranslationKey } from '../i18n'
import type { ReasonCode, Recommendation, RepRange } from './engine'

const reasonTranslations: Record<ReasonCode, TranslationKey> = {
  no_history: 'workout.trainer.reason.no_history',
  exceeded_target: 'workout.trainer.reason.exceeded_target',
  reached_top_of_range: 'workout.trainer.reason.reached_top_of_range',
  within_range: 'workout.trainer.reason.within_range',
  drop_off_across_sets: 'workout.trainer.reason.drop_off_across_sets',
  slightly_below_target: 'workout.trainer.reason.slightly_below_target',
  below_target_twice: 'workout.trainer.reason.below_target_twice',
  below_target_once: 'workout.trainer.reason.below_target_once',
  original_too_easy: 'workout.trainer.reason.original_too_easy',
  converted_rep_range: 'workout.trainer.reason.converted_rep_range',
  deload_week: 'workout.trainer.reason.deload_week',
  long_break: 'workout.trainer.reason.long_break',
  outlier_capped: 'workout.trainer.reason.outlier_capped',
}

export function trainerRangeLabel(range: RepRange, language: Language) {
  return range.min === range.max
    ? formatNumber(language, range.min)
    : `${formatNumber(language, range.min)}–${formatNumber(language, range.max)}`
}

export function trainerReason(
  t: Translate,
  language: Language,
  recommendation: Recommendation,
  target: RepRange
) {
  const evidence = recommendation.evidence
  return t(reasonTranslations[recommendation.reason], {
    reps: evidence.lastReps?.map((reps) => formatNumber(language, reps)).join(' · ') ?? '',
    weight: formatNumber(language, evidence.lastWeight ?? 0),
    target: trainerRangeLabel(evidence.lastTarget ?? target, language),
    todayTarget: trainerRangeLabel(target, language),
    days: evidence.daysSinceLast ?? 0,
  })
}
