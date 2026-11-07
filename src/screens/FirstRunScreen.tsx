import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import AiConsentPrompt from '../components/AiConsentPrompt'
import { formatShortDate, useT, type TranslationKey } from '../i18n'
import { localizeBlock, useSpanishContentReady } from '../i18n/content'
import { buildMyPlan, type BuiltPlan } from '../plans/buildMyPlan'
import {
  completeAnswers,
  publishFirstRunPlan,
  saveFirstRunGoal,
  unansweredCount,
  type FirstRunAnswers,
  type FirstRunDeps,
} from '../plans/firstRun'
import {
  fetchActiveUserPlan,
  fetchTrainingGoal,
  publishUserPlan,
  saveTrainingGoal,
  trainingGoalOptions,
  type TrainingGoal,
  type TrainingGoalInput,
} from '../utils/profileData'
import { cacheActiveUserPlan, getAskExerciseAiConsent, getFirstRunDraft, loadExercises, saveFirstRunDraft, setAskExerciseAiConsent } from '../utils/storage'
import { NEW_USER_DEMO_URL } from '../utils/demoMode'

const LoginScreen = lazy(() => import('./LoginScreen'))

type QuestionKey = keyof FirstRunAnswers
// Same labels as the Profile goal form; helper lines only where the PT spec asks for them.
const QUESTIONS: Record<QuestionKey, { label: TranslationKey; prefix: string; help?: string }> = {
  goal: { label: 'profile.goal.field.goal', prefix: 'profile.goal.choice' },
  experience: { label: 'profile.goal.field.experience', prefix: 'profile.goal.experience', help: 'firstRun.help.experience' },
  daysPerWeek: { label: 'profile.goal.field.days', prefix: 'profile.goal.days' },
  equipment: { label: 'profile.goal.field.equipment', prefix: 'profile.goal.equipment', help: 'firstRun.help.equipment' },
  sessionMinutes: { label: 'profile.goal.field.minutes', prefix: 'profile.goal.minutes' },
  activityLevel: { label: 'profile.goal.field.activity', prefix: 'profile.goal.activity', help: 'firstRun.help.activity' },
}

function Question({ name, answers, onChange }: {
  name: QuestionKey
  answers: FirstRunAnswers
  onChange: (answers: FirstRunAnswers) => void
}) {
  const { t } = useT()
  const question = QUESTIONS[name]
  const label = t(question.label)
  const options = trainingGoalOptions[name] as readonly (string | number)[]
  return (
    <fieldset className="profile-choice-group">
      <legend>{label}</legend>
      <div className={`profile-choice-chips${question.help ? ' first-run-stack' : ''}`} role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={answers[name] === option ? 'profile-choice active' : 'profile-choice'}
            aria-pressed={answers[name] === option}
            onClick={() => onChange({ ...answers, [name]: option })}
          >
            {question.help ? (
              <>
                <span>{t(`${question.prefix}.${option}` as TranslationKey)}</span>
                <small>{t(`${question.help}.${option}` as TranslationKey)}</small>
              </>
            ) : t(`${question.prefix}.${option}` as TranslationKey)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Signed out: the six questions, then account creation. The answers wait on the device until the account exists. */
export function FirstRunQuestions({ initialAnswers, onAnswered, onHaveAccount, demo = false }: {
  initialAnswers?: FirstRunAnswers
  onAnswered: (goal: TrainingGoalInput) => void
  onHaveAccount: () => void
  /** New-user demo: no account step. */
  demo?: boolean
}) {
  const { t } = useT()
  const [answers, setAnswersState] = useState<FirstRunAnswers>(() => {
    if (!initialAnswers) return getFirstRunDraft()
    const { notes: _notes, ...rest } = initialAnswers as TrainingGoalInput
    return rest
  })
  const setAnswers = (next: FirstRunAnswers) => {
    setAnswersState(next)
    saveFirstRunDraft(next)
  }
  const [step, setStep] = useState<'questions' | 'account'>('questions')
  const left = unansweredCount(answers)

  if (step === 'account') {
    return (
      <Suspense fallback={<section className="card account-screen">{t('account.loading')}</section>}>
        <LoginScreen
          initialMode="sign-up"
          backLabel={t('firstRun.account.back')}
          intro={t('firstRun.account.note')}
          onClose={() => setStep('questions')}
        />
      </Suspense>
    )
  }

  const question = (name: QuestionKey) => <Question name={name} answers={answers} onChange={setAnswers} />
  return (
    <div className="first-run">
      <p className="first-run-hint">{t('firstRun.intro')}</p>
      {demo
        ? <p className="account-message" role="status">{t('firstRun.demoNote')}</p>
        : (
          <>
            <button type="button" className="secondary-button" onClick={onHaveAccount}>{t('firstRun.haveAccount')}</button>
            <a className="secondary-button" href={NEW_USER_DEMO_URL}>{t('firstRun.tryNewUserDemo')}</a>
          </>
        )}
      <section className="card" aria-labelledby="first-run-safety">
        <h3 id="first-run-safety">{t('firstRun.safety.title')}</h3>
        <p className="first-run-hint">{t('firstRun.safety.body')}</p>
      </section>
      <section className="card" aria-labelledby="first-run-goal">
        <h2 id="first-run-goal">{t('firstRun.card.goal')}</h2>
        {question('goal')}
        {question('experience')}
      </section>
      <section className="card" aria-labelledby="first-run-training">
        <h2 id="first-run-training">{t('firstRun.card.training')}</h2>
        {question('daysPerWeek')}
        {question('equipment')}
        {question('sessionMinutes')}
        {question('activityLevel')}
      </section>
      <div className="first-run-cta">
        <button
          type="button"
          className="primary-button"
          disabled={left > 0}
          onClick={() => {
            const goal = completeAnswers(answers)
            if (!goal) return
            onAnswered(goal)
            if (!demo) setStep('account')
          }}
        >
          {left === 0 ? t('firstRun.continue') : left === 1 ? t('firstRun.left.one') : t('firstRun.left.other', { count: left })}
        </button>
      </div>
    </div>
  )
}

/** New-user demo: nothing leaves the device; the plan is cached in the demo's own space. */
const demoDeps: FirstRunDeps = {
  fetchTrainingGoal: async () => null,
  fetchActiveUserPlan: async () => null,
  saveTrainingGoal: async (goal) => goal,
  loadExercises: () => loadExercises(),
  buildMyPlan,
  publishUserPlan: async () => undefined,
  cacheActiveUserPlan,
  useAi: false,
}

const deps: FirstRunDeps = {
  fetchTrainingGoal,
  fetchActiveUserPlan,
  saveTrainingGoal,
  loadExercises: () => loadExercises(),
  buildMyPlan,
  publishUserPlan,
  cacheActiveUserPlan,
}

type PlanStage =
  | { kind: 'saving' }
  | { kind: 'consent'; goal: TrainingGoal }
  | { kind: 'building' }
  | { kind: 'ready'; plan: BuiltPlan }
  | { kind: 'kept' }
  | { kind: 'error'; goal?: TrainingGoal }

/** Signed in with first-run answers waiting: save them, ask about AI once, build and publish the plan. */
export function FirstRunPlan({ goal, onDone, demo = false }: { goal: TrainingGoalInput; onDone: () => void; demo?: boolean }) {
  const { t, language } = useT()
  const [stage, setStage] = useState<PlanStage>({ kind: 'saving' })
  const started = useRef(false)

  const build = async (saved: TrainingGoal) => {
    setStage({ kind: 'building' })
    try {
      setStage({ kind: 'ready', plan: await publishFirstRunPlan(saved, demo ? demoDeps : deps, language) })
    } catch {
      setStage({ kind: 'error', goal: saved })
    }
  }

  const save = async () => {
    setStage({ kind: 'saving' })
    try {
      const saved = await saveFirstRunGoal(goal, demo ? demoDeps : deps)
      if (saved === 'kept') setStage({ kind: 'kept' })
      else if (demo) await build(saved)
      // Ask before building, so the plan request never triggers the consent sheet on its own.
      else if (getAskExerciseAiConsent() === null) setStage({ kind: 'consent', goal: saved })
      else await build(saved)
    } catch {
      setStage({ kind: 'error' })
    }
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    void save()
  }, [])

  if (stage.kind === 'consent') {
    return (
      <section className="card">
        <AiConsentPrompt onChoice={(choice) => {
          setAskExerciseAiConsent(choice)
          void build(stage.goal)
        }} />
      </section>
    )
  }
  if (stage.kind === 'saving' || stage.kind === 'building') {
    return <section className="card account-screen" aria-live="polite"><p>{t('firstRun.building')}</p></section>
  }
  if (stage.kind === 'error') {
    const failed = stage.goal
    return (
      <section className="card account-screen" role="alert">
        <p>{t('firstRun.error')}</p>
        <button type="button" className="primary-button" onClick={() => void (failed ? build(failed) : save())}>{t('firstRun.retry')}</button>
      </section>
    )
  }
  return (
    <div className="first-run">
      {stage.kind === 'ready'
        ? <PlanReadyCard plan={stage.plan} />
        : <section className="card" aria-live="polite"><p>{t('firstRun.kept')}</p></section>}
      <div className="first-run-cta">
        <button type="button" className="primary-button" onClick={onDone}>{t('firstRun.seeToday')}</button>
      </div>
    </div>
  )
}

/** The new plan as Today will show it: name, the 6-week bar, the days and when week 1 starts. */
export function PlanReadyCard({ plan }: { plan: BuiltPlan }) {
  const { t, language } = useT()
  useSpanishContentReady(language)
  const block = localizeBlock(plan.block, language)
  return (
    <section className="card first-run-ready" aria-live="polite" aria-labelledby="first-run-ready-title">
      <p className="first-run-ready-label">{t('firstRun.ready')}</p>
      <h2 id="first-run-ready-title">{block.name}</h2>
      <div className="first-run-weeks-row">
        <div className="first-run-weeks" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${block.weeks}, 1fr)` }}>
          {Array.from({ length: block.weeks }, (_, index) => <i key={index} />)}
        </div>
        <span className="first-run-weeks-label">{t('workout.block.weekOf', { week: 1, total: block.weeks })}</span>
      </div>
      <ol className="first-run-days">
        {block.days.map((day) => (
          <li key={day.key}>
            <strong>{t('workout.day.title', { position: day.position, name: day.name })}</strong>
            <span>{t('progress.sessions.count', { count: day.exercises.length })}</span>
          </li>
        ))}
      </ol>
      <p className="first-run-hint">{block.startsOnFirstLog
        ? t('firstRun.startsFirst')
        : t('profile.plan.starts', { date: formatShortDate(language, plan.startDate) })}</p>
      {plan.cappedForBeginner && <p className="first-run-hint">{t('profile.plan.beginnerNote')}</p>}
    </section>
  )
}
