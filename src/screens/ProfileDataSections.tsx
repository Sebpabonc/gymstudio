import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { formatNumber, formatShortDate, Language, TranslationKey, useT } from '../i18n'
import { localIsoDate } from '../lib/dates'
import {
  BodyMetric,
  fetchBodyMetric,
  fetchBodyMetrics,
  fetchTrainingGoal,
  saveBodyMetric,
  saveTrainingGoal,
  TrainingGoal,
  TrainingGoalInput,
  trainingGoalOptions,
} from '../utils/profileData'

const emptyGoal: TrainingGoalInput = {
  goal: 'muscle',
  daysPerWeek: 3,
  experience: 'beginner',
  activityLevel: 'moderate',
  sessionMinutes: 45,
  equipment: 'full_gym',
  notes: '',
}

function asMetricInput(metric: BodyMetric | null) {
  return {
    weightKg: metric?.weight_kg?.toString() ?? '',
    steps: metric?.steps?.toString() ?? '',
    calories: metric?.calories?.toString() ?? '',
  }
}

type ChoiceGroupProps<T extends string | number> = {
  label: string
  translationPrefix: string
  value: T
  options: readonly T[]
  disabled: boolean
  onChange: (value: T) => void
}

function ChoiceGroup<T extends string | number>({ label, translationPrefix, value, options, disabled, onChange }: ChoiceGroupProps<T>) {
  const { t } = useT()
  return (
    <fieldset className="profile-choice-group" disabled={disabled}>
      <legend>{label}</legend>
      <div className="profile-choice-chips" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'profile-choice active' : 'profile-choice'}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {t(`${translationPrefix}.${option}` as TranslationKey)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function goalSummary(goal: TrainingGoal, t: ReturnType<typeof useT>['t']) {
  return [
    t(`profile.goal.choice.${goal.goal}` as TranslationKey),
    t('profile.goal.daysSummary', { days: goal.daysPerWeek }),
    t(`profile.goal.experience.${goal.experience}` as TranslationKey),
    t('profile.goal.minutesSummary', { minutes: goal.sessionMinutes }),
    t(`profile.goal.equipment.${goal.equipment}` as TranslationKey),
  ].join(' · ')
}

function buildWeightTrend(metrics: BodyMetric[], language: Language) {
  const points = metrics
    .filter((metric): metric is BodyMetric & { weight_kg: number } => metric.weight_kg !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (points.length === 0) return null
  const weights = points.map((point) => point.weight_kg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const span = max - min || 1
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? 150 : 12 + (index / (points.length - 1)) * 276,
    y: 80 - ((point.weight_kg - min) / span) * 64,
    label: `${formatShortDate(language, point.date)}: ${point.weight_kg} kg`,
  }))
  return {
    coordinates,
    path: coordinates.map((point) => `${point.x},${point.y}`).join(' '),
  }
}

export default function ProfileDataSections() {
  const { t, language } = useT()
  const { user } = useAuth()
  const disabled = !user
  const today = localIsoDate()
  const [selectedDate, setSelectedDate] = useState(today)
  const [metricInput, setMetricInput] = useState(asMetricInput(null))
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [rangeDays, setRangeDays] = useState<30 | 90>(30)
  const [goal, setGoal] = useState<TrainingGoalInput>(emptyGoal)
  const [savedGoal, setSavedGoal] = useState<TrainingGoal | null>(null)
  const [editingGoal, setEditingGoal] = useState(true)
  const [loading, setLoading] = useState(!disabled)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (disabled) {
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const start = new Date(`${today}T00:00:00`)
    start.setDate(start.getDate() - 89)
    const since = localIsoDate(start)
    void Promise.all([fetchBodyMetrics(since, today), fetchTrainingGoal()])
      .then(([history, saved]) => {
        if (!active) return
        setMetrics(history)
        setSavedGoal(saved)
        setGoal(saved ?? emptyGoal)
        setEditingGoal(!saved)
      })
      .catch((cause) => {
        if (active) setError(getFriendlyError(cause, t))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [disabled, today, t])

  useEffect(() => {
    if (disabled) {
      setMetricInput(asMetricInput(null))
      return
    }
    let active = true
    void fetchBodyMetric(selectedDate)
      .then((metric) => {
        if (active) setMetricInput(asMetricInput(metric))
      })
      .catch((cause) => {
        if (active) setError(getFriendlyError(cause, t))
      })
    return () => { active = false }
  }, [disabled, selectedDate, t])

  const visibleMetrics = useMemo(() => {
    const cutoff = new Date(`${today}T00:00:00`)
    cutoff.setDate(cutoff.getDate() - (rangeDays - 1))
    const since = localIsoDate(cutoff)
    return metrics.filter((metric) => metric.date >= since && metric.date <= today)
  }, [metrics, rangeDays, today])
  const trend = useMemo(() => buildWeightTrend(visibleMetrics, language), [visibleMetrics, language])

  const submitMetric = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const saved = await saveBodyMetric(selectedDate, metricInput)
      setMetricInput(asMetricInput(saved))
      const start = new Date(`${today}T00:00:00`)
      start.setDate(start.getDate() - 89)
      setMetrics(await fetchBodyMetrics(localIsoDate(start), today))
      setNotice(t('profile.data.saved'))
    } catch (cause) {
      setError(getFriendlyError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  const submitGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const saved = await saveTrainingGoal(goal)
      setSavedGoal(saved)
      setGoal(saved)
      setEditingGoal(false)
      setNotice(t('profile.data.saved'))
    } catch (cause) {
      setError(getFriendlyError(cause, t))
    } finally {
      setBusy(false)
    }
  }

  const summary = savedGoal ? goalSummary(savedGoal, t) : ''

  return (
    <>
      <section className="card profile-data-card" aria-labelledby="profile-measurements-title">
        <h2 id="profile-measurements-title">{t('profile.measurements.title')}</h2>
        {disabled && <p className="profile-data-hint">{t('profile.data.signIn')}</p>}
        <form onSubmit={submitMetric}>
          <fieldset className="profile-data-fields" disabled={disabled || busy}>
            <label className="profile-data-field">
              <span>{t('profile.measurements.date')}</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
            <label className="profile-data-field">
              <span>{t('profile.measurements.weight')}</span>
              <input type="number" inputMode="decimal" min="25" max="350" step="0.1" value={metricInput.weightKg} onChange={(event) => setMetricInput({ ...metricInput, weightKg: event.target.value })} />
            </label>
            <label className="profile-data-field">
              <span>{t('profile.measurements.steps')}</span>
              <input type="number" inputMode="numeric" min="0" max="100000" step="1" value={metricInput.steps} onChange={(event) => setMetricInput({ ...metricInput, steps: event.target.value })} />
            </label>
            <label className="profile-data-field">
              <span>{t('profile.measurements.calories')}</span>
              <input type="number" inputMode="numeric" min="0" max="10000" step="1" value={metricInput.calories} onChange={(event) => setMetricInput({ ...metricInput, calories: event.target.value })} />
            </label>
          </fieldset>
          <button type="submit" className="primary-button profile-data-save" disabled={disabled || busy}>
            {busy ? t('profile.data.saving') : t('profile.measurements.save')}
          </button>
        </form>
        {loading && <p className="profile-data-hint">{t('profile.data.loading')}</p>}
        {metrics.length > 0 && (
          <div className="profile-measurement-history">
            <div className="profile-range-toggle" role="group" aria-label={t('profile.measurements.range')}>
              {([30, 90] as const).map((days) => (
                <button key={days} type="button" aria-pressed={rangeDays === days} onClick={() => setRangeDays(days)}>
                  {t('profile.measurements.days', { days })}
                </button>
              ))}
            </div>
            {trend && (
              <svg className="profile-weight-chart" viewBox="0 0 300 100" role="img" aria-label={t('profile.measurements.trend')}>
                <polyline points={trend.path} className="profile-weight-line" />
                {trend.coordinates.map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="3" aria-label={point.label} />)}
              </svg>
            )}
            <ul className="profile-measurement-list">
              {visibleMetrics.map((metric) => (
                <li key={metric.date}>
                  <strong>{formatShortDate(language, metric.date)}</strong>
                  <span>
                    {metric.weight_kg !== null && `${formatNumber(language, metric.weight_kg)} kg`}
                    {metric.steps !== null && ` · ${formatNumber(language, metric.steps)} ${t('profile.measurements.stepsShort')}`}
                    {metric.calories !== null && ` · ${formatNumber(language, metric.calories)} ${t('profile.measurements.caloriesShort')}`}
                  </span>
                </li>
              ))}
            </ul>
            {visibleMetrics.length === 0 && <p className="profile-data-hint">{t('profile.measurements.empty')}</p>}
          </div>
        )}
      </section>

      <section className="card profile-data-card" aria-labelledby="profile-goal-title">
        <h2 id="profile-goal-title">{t('profile.goal.title')}</h2>
        <p className="profile-data-hint">{t('profile.goal.copy')}</p>
        {disabled && <p className="profile-data-hint">{t('profile.data.signIn')}</p>}
        {loading ? (
          <p className="profile-data-hint">{t('profile.data.loading')}</p>
        ) : savedGoal && !editingGoal ? (
          <div className="profile-goal-summary">
            <p>{summary}</p>
            <button type="button" className="secondary-button" onClick={() => setEditingGoal(true)} disabled={disabled}>
              {t('profile.goal.edit')}
            </button>
          </div>
        ) : (
          <form onSubmit={submitGoal}>
            <ChoiceGroup label={t('profile.goal.field.goal')} translationPrefix="profile.goal.choice" value={goal.goal} options={trainingGoalOptions.goal} disabled={disabled || busy} onChange={(value) => setGoal({ ...goal, goal: value })} />
            <ChoiceGroup label={t('profile.goal.field.days')} translationPrefix="profile.goal.days" value={goal.daysPerWeek} options={trainingGoalOptions.daysPerWeek} disabled={disabled || busy} onChange={(value) => setGoal({ ...goal, daysPerWeek: value })} />
            <ChoiceGroup label={t('profile.goal.field.experience')} translationPrefix="profile.goal.experience" value={goal.experience} options={trainingGoalOptions.experience} disabled={disabled || busy} onChange={(value) => setGoal({ ...goal, experience: value })} />
            <ChoiceGroup label={t('profile.goal.field.activity')} translationPrefix="profile.goal.activity" value={goal.activityLevel} options={trainingGoalOptions.activityLevel} disabled={disabled || busy} onChange={(value) => setGoal({ ...goal, activityLevel: value })} />
            <ChoiceGroup label={t('profile.goal.field.minutes')} translationPrefix="profile.goal.minutes" value={goal.sessionMinutes} options={trainingGoalOptions.sessionMinutes} disabled={disabled || busy} onChange={(value) => setGoal({ ...goal, sessionMinutes: value })} />
            <ChoiceGroup label={t('profile.goal.field.equipment')} translationPrefix="profile.goal.equipment" value={goal.equipment} options={trainingGoalOptions.equipment} disabled={disabled || busy} onChange={(value) => setGoal({ ...goal, equipment: value })} />
            <label className="profile-data-field profile-goal-notes">
              <span>{t('profile.goal.notes')}</span>
              <textarea maxLength={500} value={goal.notes} onChange={(event) => setGoal({ ...goal, notes: event.target.value })} />
            </label>
            <button type="submit" className="primary-button profile-data-save" disabled={disabled || busy}>
              {busy ? t('profile.data.saving') : t('profile.goal.save')}
            </button>
          </form>
        )}
      </section>
      {(error || notice) && (
        <div className="profile-data-feedback">
          {error && <p className="account-error" role="alert">{error}</p>}
          {notice && <p className="account-message" role="status">{notice}</p>}
        </div>
      )}
    </>
  )
}

function getFriendlyError(cause: unknown, t: ReturnType<typeof useT>['t']) {
  const message = cause instanceof Error ? cause.message.toLowerCase() : ''
  return message === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine)
    ? t('profile.data.offline')
    : t('profile.data.error')
}
