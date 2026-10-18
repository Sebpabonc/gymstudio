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
  incomplete_session: 'workout.trainer.reason.incomplete_session',
  light_load_add_reps: 'workout.trainer.reason.light_load_add_reps',
  bodyweight_add_reps: 'workout.trainer.reason.bodyweight_add_reps',
  double_angle: 'workout.trainer.reason.double_angle',
  consolidate_load: 'workout.trainer.reason.consolidate_load',
  achieved_floor: 'workout.trainer.reason.achieved_floor',
  same_day_boost: 'workout.trainer.reason.same_day_boost',
}

export function trainerRangeLabel(range: RepRange, language: Language) {
  return range.min === range.max
    ? formatNumber(language, range.min)
    : `${formatNumber(language, range.min)}–${formatNumber(language, range.max)}`
}

// R24 (PT 2026-10-13): when the load is not above the last one and only the rep target changed,
// the user sees "adjusted to N reps", never "increase"/"decrease"/"same-day boost".
export function isRepTargetAdjustment(recommendation: Recommendation, target: RepRange) {
  const { lastWeight, lastTarget } = recommendation.evidence
  if (lastWeight === undefined || !lastTarget) return false
  const changed = lastTarget.min !== target.min || lastTarget.max !== target.max
  const top = Math.max(recommendation.weight ?? 0, ...(recommendation.setWeights ?? []))
  return changed && top <= lastWeight && recommendation.reason !== 'deload_week' &&
    recommendation.reason !== 'below_target_once' && recommendation.reason !== 'below_target_twice' &&
    recommendation.reason !== 'slightly_below_target'
}

export function trainerReason(
  t: Translate,
  language: Language,
  recommendation: Recommendation,
  target: RepRange
) {
  const evidence = recommendation.evidence
  const key = isRepTargetAdjustment(recommendation, target)
    ? reasonTranslations.converted_rep_range
    : reasonTranslations[recommendation.reason]
  return t(key, {
    reps: evidence.lastReps?.map((reps) => formatNumber(language, reps)).join(' · ') ?? '',
    weight: formatNumber(language, evidence.lastWeight ?? 0),
    target: trainerRangeLabel(evidence.lastTarget ?? target, language),
    todayTarget: trainerRangeLabel(target, language),
    days: evidence.daysSinceLast ?? 0,
  })
}
