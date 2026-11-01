import { formatNumber, formatWeekdayDate } from '../i18n/format'
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
  recent_miss_cap: 'workout.trainer.reason.recent_miss_cap',
}

export function trainerRangeLabel(range: RepRange, language: Language) {
  return range.min === range.max
    ? formatNumber(language, range.min)
    : `${formatNumber(language, range.min)}–${formatNumber(language, range.max)}`
}

// R24 (PT 2026-10-13): when the load is not above the last one and only the rep target changed,
// the user sees "adjusted to N reps", never "increase"/"decrease"/"same-day boost".
export function isRepTargetAdjustment(recommendation: Recommendation, target: RepRange) {
  const { lastGridWeight, lastTarget } = recommendation.evidence
  const lastWeight = lastGridWeight ?? recommendation.evidence.lastWeight
  if (lastWeight === undefined || !lastTarget) return false
  const changed = lastTarget.min !== target.min || lastTarget.max !== target.max
  const top = Math.max(recommendation.weight ?? 0, ...(recommendation.setWeights ?? []))
  return changed && top <= lastWeight && recommendation.reason !== 'deload_week' &&
    recommendation.reason !== 'below_target_once' && recommendation.reason !== 'below_target_twice' &&
    recommendation.reason !== 'slightly_below_target' && recommendation.reason !== 'same_day_boost' &&
    recommendation.reason !== 'recent_miss_cap'
}

// R31d: a logged load the cable does not have is shown as logged, with the load it counted as.
function offGridNote(t: Translate, language: Language, logged: number, grid: number) {
  return t('workout.trainer.offGridLoad', { logged: formatNumber(language, logged), grid: formatNumber(language, grid) })
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
  const recentMiss = evidence.recentMiss
  const sameDayMiss = (recommendation.reason === 'below_target_once' || recommendation.reason === 'slightly_below_target') &&
    evidence.sameDayTarget?.min === target.min && evidence.sameDayTarget.max === target.max
  const reason = t(key, {
    reps: recommendation.reason === 'recent_miss_cap' && recentMiss
      ? formatNumber(language, recentMiss.reps)
      : sameDayMiss
        ? evidence.sameDayReps?.map((reps) => formatNumber(language, reps)).join(' · ') ?? ''
      : evidence.lastReps?.map((reps) => formatNumber(language, reps)).join(' · ') ?? '',
    weight: formatNumber(language, recommendation.reason === 'recent_miss_cap' && recentMiss
      ? recentMiss.weight
      : sameDayMiss
        ? evidence.sameDayWeight ?? 0
      : recommendation.reason === 'same_day_boost' && evidence.sameDayWeight !== undefined
        ? evidence.sameDayWeight
        : evidence.lastWeight ?? 0),
    target: trainerRangeLabel(sameDayMiss ? evidence.sameDayTarget ?? target : evidence.lastTarget ?? target, language),
    todayTarget: trainerRangeLabel(target, language),
    days: evidence.daysSinceLast ?? 0,
    dayName: evidence.sameDayName ?? (evidence.sameDayDate
      ? formatWeekdayDate(language, evidence.sameDayDate)
      : ''),
    sameDayReps: evidence.sameDayReps?.map((reps) => formatNumber(language, reps)).join(' · ') ?? '',
    sameDayWeight: formatNumber(language, evidence.sameDayWeight ?? 0),
    newWeight: formatNumber(language, recommendation.weight ?? 0),
    ...(recentMiss ? {
      target: formatNumber(language, recentMiss.target),
      newWeight: formatNumber(language, recentMiss.newWeight),
    } : {}),
  })
  if (recommendation.firstSessionProtocol) {
    const protocol = [
      t('workout.trainer.firstSession.warmup'),
      t('workout.trainer.firstSession.effort', { target: trainerRangeLabel(target, language) }),
      t(recommendation.firstSessionProtocol === 'reverse-pyramid'
        ? 'workout.trainer.firstSession.reversePyramid'
        : 'workout.trainer.firstSession.pyramid'),
      t('workout.trainer.firstSession.log'),
    ]
    return protocol.join('\n')
  }

  if (
    evidence.sameDayDate &&
    evidence.sameDayWeight !== undefined &&
    evidence.lastTarget &&
    (evidence.lastTarget.min !== target.min || evidence.lastTarget.max !== target.max)
  ) {
    const reference = evidence.sameDayGridWeight ?? evidence.sameDayWeight
    const delta = Math.abs((recommendation.weight ?? reference) - reference)
    const change = evidence.sameDayGridWeight !== undefined
      ? offGridNote(t, language, evidence.sameDayWeight, evidence.sameDayGridWeight)
      : delta === 0
      ? t('workout.trainer.sameDayComparison.same')
      : t(
        (recommendation.weight ?? reference) > reference
          ? 'workout.trainer.sameDayComparison.up'
          : 'workout.trainer.sameDayComparison.down',
        { delta: formatNumber(language, delta) }
      )
    const comparison = t('workout.trainer.sameDayComparison', {
      dayName: evidence.sameDayName ?? formatWeekdayDate(language, evidence.sameDayDate),
      date: formatWeekdayDate(language, evidence.sameDayDate),
      weight: formatNumber(language, evidence.sameDayWeight),
      reps: evidence.sameDayReps?.map((reps) => formatNumber(language, reps)).join(' · ') ?? '',
      change,
    })
    return `${comparison}\n${reason}`
  }

  return evidence.lastWeight !== undefined && evidence.lastGridWeight !== undefined
    ? `${reason}\n${offGridNote(t, language, evidence.lastWeight, evidence.lastGridWeight)}`
    : reason
}
