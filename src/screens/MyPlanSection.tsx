import React from 'react'
import { formatShortDate, useT } from '../i18n'
import type { BuiltPlan } from '../plans/buildMyPlan'
import type { Exercise } from '../types'
import { getExerciseDisplayName } from '../utils/storage'
import type { SavedUserPlan, TrainingGoal } from '../utils/profileData'

type PlanPreview = Pick<BuiltPlan, 'startDate' | 'block' | 'source' | 'cappedForBeginner'>

type Props = {
  goal: TrainingGoal | null
  activePlan: SavedUserPlan | null
  preview: PlanPreview | null
  exercises: Exercise[]
  loading: boolean
  building: boolean
  publishing: boolean
  confirmingRegeneration: boolean
  onGenerate: () => void
  onPublish: () => void
  onRegenerate: () => void
  onConfirmRegeneration: () => void
  onCancelRegeneration: () => void
}

export default function MyPlanSection({
  goal,
  activePlan,
  preview,
  exercises,
  loading,
  building,
  publishing,
  confirmingRegeneration,
  onGenerate,
  onPublish,
  onRegenerate,
  onConfirmRegeneration,
  onCancelRegeneration,
}: Props) {
  const { t, language } = useT()
  const exerciseName = (id: string) => {
    const exercise = exercises.find((item) => item.id === id)
    return exercise ? getExerciseDisplayName(exercise, language) : id
  }

  const renderPlan = (plan: PlanPreview, isPreview: boolean) => (
    <div className="personal-plan-details">
      <div className="personal-plan-heading">
        <h3>{plan.block.name}</h3>
        {plan.source === 'ai' && <span className="personal-plan-badge">{t('profile.plan.aiBadge')}</span>}
      </div>
      <p className="profile-data-hint">{t('profile.plan.starts', { date: formatShortDate(language, plan.startDate) })}</p>
      {plan.cappedForBeginner && <p className="profile-data-hint">{t('profile.plan.beginnerNote')}</p>}
      <p>{plan.block.summary}</p>
      {plan.block.insights.length > 0 && (
        <ul className="personal-plan-insights">
          {plan.block.insights.map((insight, index) => (
            <li key={`${insight.title}-${index}`}>
              <strong>{insight.title}</strong>
              <p>{insight.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="personal-plan-days">
        {plan.block.days.map((day) => (
          <section className="personal-plan-day" key={day.key}>
            <h4>{day.name}</h4>
            {day.focus && <p className="profile-data-hint">{day.focus}</p>}
            <ul>
              {day.exercises.map((exercise) => (
                <li key={exercise.code}>
                  <span>{exerciseName(exercise.exerciseId)}</span>
                  <strong>{exercise.sets} × {exercise.reps.join(' / ')}</strong>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {isPreview && (
        <div className="personal-plan-actions">
          <button type="button" className="primary-button" onClick={onPublish} disabled={publishing}>
            {publishing ? t('profile.plan.publishing') : t('profile.plan.publish')}
          </button>
          <button type="button" className="secondary-button" onClick={onRegenerate} disabled={loading || publishing}>
            {t('profile.plan.regenerate')}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <section className="card profile-data-card personal-plan-card" aria-labelledby="profile-plan-title">
      <h2 id="profile-plan-title">{t('profile.plan.title')}</h2>
      {!goal && <p className="profile-data-hint">{t('profile.plan.noGoal')}</p>}
      {activePlan && (
        <div className="personal-plan-active">
          <h3>{t('profile.plan.active')}</h3>
          {renderPlan({ ...activePlan, cappedForBeginner: false }, false)}
          <button type="button" className="secondary-button" onClick={onRegenerate} disabled={loading || publishing}>
            {t('profile.plan.regenerate')}
          </button>
        </div>
      )}
      {confirmingRegeneration && (
        <div className="personal-plan-confirmation" role="group" aria-label={t('profile.plan.confirmTitle')}>
          <p>{t('profile.plan.confirmCopy')}</p>
          <button type="button" className="primary-button" onClick={onConfirmRegeneration} disabled={loading}>
            {t('profile.plan.confirm')}
          </button>
          <button type="button" className="secondary-button" onClick={onCancelRegeneration}>
            {t('profile.plan.cancel')}
          </button>
        </div>
      )}
      {preview && (
        <div className="personal-plan-preview">
          <h3>{t('profile.plan.preview')}</h3>
          {renderPlan(preview, true)}
        </div>
      )}
      {!preview && !activePlan && goal && (
        <button type="button" className="primary-button" onClick={onGenerate} disabled={loading}>
          {building ? t('profile.plan.building') : t('profile.plan.generate')}
        </button>
      )}
      {building && (!preview || confirmingRegeneration) && (
        <p className="profile-data-hint" role="status">{t('profile.plan.building')}</p>
      )}
    </section>
  )
}
