import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WorkoutPlan from './components/WorkoutPlan'
import ExerciseSearchSuggestions from './components/ExerciseSearchSuggestions'
import RestTimer from './components/RestTimer'
import { syncRestTimerActivity } from './native/restTimerActivity'
import { openExternal } from './native/openExternal'
import { localizeCatalogue, useSpanishContentReady } from './i18n/content'
import { exerciseImageQuery, exerciseImageSearchUrl } from './utils/exerciseImages'
import ExerciseSetTable from './components/ExerciseSetTable'
import SqueezeCue from './components/SqueezeCue'
import HelpAndAi from './components/HelpAndAi'
import { localIsoDate } from './lib/dates'
import { AppTab, getNavigationTitle, navigationTabs } from './navigation'
import { Exercise, ExerciseTip, WorkoutEntry, WorkoutSet } from './types'
import { useAuth } from './auth/AuthProvider'
import { useTextEntryFocused } from './utils/textEntryFocus'
import { exitDemoMode, isDemoMode } from './utils/demoMode'
import {
  fetchTrainingBlocks,
  dismissWelcome,
  getExerciseDisplayName,
  hasDismissedWelcome,
  loadExercises,
  loadRestTimerState,
  loadWorkoutHistory,
  deleteWorkoutEntry,
  refreshCatalogue,
  restoreWorkoutEntry,
  saveWorkoutHistory,
  saveRestTimerState,
  getLayoutMode,
  recordHelpAiAppOpen,
  setLayoutMode,
} from './utils/storage'
import { formatShortDate, localizeMuscle, TranslationKey, useT } from './i18n'
import { RestTimerState, startRestTimer } from './utils/restTimer'
import { summarizeCompletedEntry } from './utils/completedExercises'
import {
  ALL_BODY_REGIONS,
  filterExercises,
  getAvailableBodyRegions,
  getExerciseTips,
} from './utils/exerciseFilters'
import {
  copyWeightToUntouchedSets,
  filterLoggableSets,
  formatWorkoutSet,
  getPreviousWorkoutSets,
  workoutMaxWeight,
  workoutVolume,
} from './utils/workoutSets'

const LoginScreen = lazy(() => import('./screens/LoginScreen'))
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'))
const ProfileDataSections = lazy(() => import('./screens/ProfileDataSections'))
const ProgressScreen = lazy(() => import('./screens/ProgressScreen'))

function createSet(reps = 8, weight = 0): WorkoutSet {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    reps,
    weight,
  }
}

function normalizeExerciseTip(tip: string | ExerciseTip) {
  if (typeof tip === 'string') {
    return { text: tip, image: undefined }
  }

  return {
    text: tip.text ?? '',
    image: tip.image ?? tip.imageUrl,
  }
}

export default function App() {
  const demoMode = isDemoMode()
  const { status, syncStatus } = useAuth()
  const [rawExercises, setExercises] = useState<Exercise[]>([])
  const [history, setHistory] = useState<WorkoutEntry[]>([])
  const [demoHistoryReady, setDemoHistoryReady] = useState(!demoMode)
  const [search, setSearch] = useState('')
  const [bodyRegion, setBodyRegion] = useState(ALL_BODY_REGIONS)
  const [selectedId, setSelectedId] = useState<string>('')
  const [draftSets, setDraftSets] = useState<WorkoutSet[]>([createSet(8, 0), createSet(8, 0)])
  const [completedSets, setCompletedSets] = useState<boolean[]>([false, false])
  const [setWeightTouched, setSetWeightTouched] = useState<boolean[]>([false, false])
  const [draftNotes, setDraftNotes] = useState('')
  const [tipsExpanded, setTipsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('today')
  const [showHelpPulse] = useState(() => recordHelpAiAppOpen() <= 3)
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(() => loadRestTimerState())
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const headerSentinelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const dockHidden = useTextEntryFocused()
  const [showWelcome, setShowWelcome] = useState(() => !hasDismissedWelcome())
  const [layoutMode, setLayoutModeState] = useState(getLayoutMode)
  const chooseLayoutMode = (mode: 'boxes' | 'sheet') => {
    setLayoutMode(mode)
    setLayoutModeState(mode)
  }
  const [exerciseMode, setExerciseMode] = useState<'lookup' | 'custom'>('lookup')
  const [progressExerciseId, setProgressExerciseId] = useState('')
  const { t, language, setLanguage } = useT()
  const spanishReady = useSpanishContentReady(language)
  const exercises = useMemo(() => localizeCatalogue(rawExercises, language), [rawExercises, language, spanishReady])

  const restLabel = useRef(t('rest.label'))
  const updateRestTimer = useCallback((timer: RestTimerState | null) => {
    saveRestTimerState(timer)
    setRestTimer(timer)
    void syncRestTimerActivity(timer, restLabel.current, false)
  }, [])
  const startRest = useCallback((durationSeconds: number, label?: string) => {
    restLabel.current = label || t('rest.label')
    const timer = startRestTimer(durationSeconds)
    saveRestTimerState(timer)
    setRestTimer(timer)
    void syncRestTimerActivity(timer, restLabel.current, true)
  }, [t])

  useEffect(() => {
    const sentinel = headerSentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderCollapsed(!entry.isIntersecting),
      { root: contentRef.current, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    const readHistory = async () => {
      const savedHistory = await loadWorkoutHistory()
      if (!demoMode) return savedHistory
      if (savedHistory.length > 0) {
        setDemoHistoryReady(true)
        return savedHistory
      }

      const blocks = await fetchTrainingBlocks()
      const { generateDemoHistory } = await import('./demo/generateDemoHistory')
      const generatedHistory = generateDemoHistory({ blocks, endDate: localIsoDate(), months: 6, seed: 26 })
      saveWorkoutHistory(generatedHistory)
      setDemoHistoryReady(true)
      return generatedHistory
    }

    void (async () => {
      const refresh = refreshCatalogue()
      const cachedExercises = await loadExercises(false)
      if (cancelled) return
      if (cachedExercises.length) {
        setExercises(cachedExercises)
        setHistory(await readHistory())
      }

      const refreshedCatalogue = await refresh
      if (!refreshedCatalogue?.length && !cachedExercises.length) {
        const [offlineExercises, offlineHistory] = await Promise.all([loadExercises(), readHistory()])
        if (cancelled) return
        setExercises(offlineExercises)
        setHistory(offlineHistory)
        return
      }
      if (!refreshedCatalogue?.length || cancelled) return

      const [updatedExercises, updatedHistory] = await Promise.all([loadExercises(false), readHistory()])
      if (cancelled) return
      setExercises(updatedExercises)
      setHistory(updatedHistory)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedExercise = useMemo(
    () =>
      exercises.find((exercise) => exercise.id === selectedId) ??
      exercises.find((exercise) => exercise.id === 'barbell-bench-press') ??
      exercises[0],
    [exercises, selectedId]
  )
  const selectedExerciseTips = selectedExercise ? getExerciseTips(selectedExercise) : []

  useEffect(() => {
    if (!selectedId && exercises.length) {
      setSelectedId(exercises.find((exercise) => exercise.id === 'barbell-bench-press')?.id ?? exercises[0].id)
    }
  }, [exercises, selectedId])

  useEffect(() => {
    if (!selectedExercise) return
    setDraftSets([createSet(8, 0), createSet(8, 0)])
    setCompletedSets([false, false])
    setSetWeightTouched([false, false])
    setDraftNotes('')
    setTipsExpanded(false)
  }, [selectedExercise])

  const availableBodyRegions = useMemo(() => getAvailableBodyRegions(exercises), [exercises])
  const filteredExercises = useMemo(
    () => filterExercises(exercises, search, bodyRegion),
    [exercises, search, bodyRegion]
  )

  const exerciseHistory = useMemo(
    () =>
      history
        .filter((entry) => entry.exerciseId === selectedExercise?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [history, selectedExercise]
  )

  const previousWorkout = exerciseHistory[0]
  const previousSets = selectedExercise ? getPreviousWorkoutSets(history, selectedExercise.id) : []
  const previousVolume = previousWorkout
    ? workoutVolume(previousWorkout.sets)
    : 0
  const previousMax = previousWorkout
    ? workoutMaxWeight(previousWorkout.sets)
    : 0

  const progressItems = exerciseHistory.slice(0, 5).map((entry) => ({
    id: entry.id,
    date: entry.date,
    maxWeight: workoutMaxWeight(entry.sets),
    totalVolume: workoutVolume(entry.sets),
  }))

  const updateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    if (field === 'weight') {
      const nextTouched = setWeightTouched.map((touched, setIndex) => touched || setIndex === index)
      setSetWeightTouched(nextTouched)
      setDraftSets((current) => {
        const nextWeights = copyWeightToUntouchedSets(
          current.map((set) => set.weight),
          nextTouched,
          index,
          Number(value) || 0
        )
        return current.map((set, setIndex) => ({ ...set, weight: nextWeights[setIndex] }))
      })
      return
    }

    setDraftSets((current) =>
      current.map((set, setIndex) => setIndex === index ? { ...set, reps: Number(value) || 0 } : set)
    )
  }

  const addSet = () => {
    setDraftSets((current) => [...current, createSet(8, Number(current[0]?.weight) || 0)])
    setCompletedSets((current) => [...current, false])
    setSetWeightTouched((current) => [...current, false])
  }

  const removeSet = (setId: string) => {
    const index = draftSets.findIndex((set) => set.id === setId)
    if (index < 0 || draftSets.length <= 1) return
    setDraftSets((current) => (current.length > 1 ? current.filter((set) => set.id !== setId) : current))
    setCompletedSets((current) => current.filter((_, setIndex) => setIndex !== index))
    setSetWeightTouched((current) => current.filter((_, setIndex) => setIndex !== index))
  }

  const [saveError, setSaveError] = useState('')
  const [saveConfirmation, setSaveConfirmation] = useState('')

  useEffect(() => {
    if (!saveConfirmation) return undefined
    const timer = window.setTimeout(() => setSaveConfirmation(''), 5000)
    return () => window.clearTimeout(timer)
  }, [saveConfirmation])

  const saveWorkout = () => {
    if (!selectedExercise) return

    const validSets = filterLoggableSets(draftSets, selectedExercise.equipment)

    if (validSets.length === 0) {
      setSaveError(t('exercises.enterOneSet'))
      return
    }

    setSaveError('')

    const nextEntry: WorkoutEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      exerciseId: selectedExercise.id,
      date: localIsoDate(),
      sets: validSets,
      notes: draftNotes.trim() || undefined,
    }

    const nextHistory = [nextEntry, ...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    setSaveConfirmation(t('exercises.logged', { summary: summarizeCompletedEntry(nextEntry, language) }))
    setDraftSets([createSet(8, 0), createSet(8, 0)])
    setCompletedSets([false, false])
    setSetWeightTouched([false, false])
    setDraftNotes('')
  }

  return (
    <div className={`app-shell layout-${layoutMode}`}>
      <div className="phone-frame">
        <main className={`app-content${restTimer ? ' with-rest-timer' : ''}`} ref={contentRef}>
          <div className="header-sentinel" ref={headerSentinelRef} aria-hidden="true" />
          <div className={`brand-bar${headerCollapsed ? ' collapsed' : ''}`}>
            <span className="brand-bar-title" aria-hidden="true">
              <span className="brand-bar-wordmark">Gym Studio</span>
              <span className="brand-bar-screen">{getNavigationTitle(activeTab, t)}</span>
            </span>
            <span className="brand-bar-actions">
            <span className="layout-toggle language-toggle" role="group" aria-label={t('lang.label')}>
              <button
                type="button"
                aria-label={t('lang.en')}
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                aria-label={t('lang.es')}
                aria-pressed={language === 'es'}
                onClick={() => setLanguage('es')}
              >
                ES
              </button>
            </span>
            <span className="layout-toggle" role="group" aria-label={t('layout.label')}>
              <button
                type="button"
                aria-label={t('layout.boxes')}
                aria-pressed={layoutMode === 'boxes'}
                onClick={() => chooseLayoutMode('boxes')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="7" rx="2.2" /><rect x="4" y="13" width="16" height="7" rx="2.2" /></svg>
              </button>
              <button
                type="button"
                aria-label={t('layout.sheet')}
                aria-pressed={layoutMode === 'sheet'}
                onClick={() => chooseLayoutMode('sheet')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5V12a7 7 0 0 1 7-7h3a7 7 0 0 1 7 7v8.5" /><path d="M8 13.5h8M8 17h8" /></svg>
              </button>
            </span>
            <span
              className={`sync-indicator ${status === 'signed-in' ? syncStatus : demoMode ? 'demo' : 'local'}`}
              role="status"
              aria-label={status === 'signed-in' ? t('sync.aria.signedIn', { status: t(`sync.${syncStatus}`) }) : demoMode ? t('sync.aria.demo') : t('sync.aria.local')}
            />
            </span>
          </div>
          <header className={`brand-header${headerCollapsed ? ' collapsed' : ''}`}>
            <span className="brand-tagline" aria-hidden="true">{t('header.tagline')}</span>
            <span className="brand-wordmark" aria-hidden="true">Gym Studio</span>
            <h1>{getNavigationTitle(activeTab, t)}</h1>
          </header>
          <div className="screen-surface">
          {activeTab === 'exercises' && (
            <div className="exercise-mode-switch" role="group" aria-label={t('exercises.tools')}>
              <button
                type="button"
                className={exerciseMode === 'lookup' ? 'active' : ''}
                aria-pressed={exerciseMode === 'lookup'}
                onClick={() => setExerciseMode('lookup')}
              >
                {t('exercises.find')}
              </button>
              <button
                type="button"
                className={exerciseMode === 'custom' ? 'active' : ''}
                aria-pressed={exerciseMode === 'custom'}
                onClick={() => setExerciseMode('custom')}
              >
                {t('exercises.custom')}
              </button>
            </div>
          )}
          {activeTab === 'you' ? (
            demoMode ? (
              <Suspense fallback={<section className="card account-screen">{t('account.loading')}</section>}>
                <>
                  <ProfileDataSections />
                  <section className="card account-screen">
                    <h2>{t('demo.title')}</h2>
                    <p className="account-message">{t('demo.message')}</p>
                    <button type="button" className="secondary-button" onClick={exitDemoMode}>{t('demo.exit')}</button>
                  </section>
                </>
              </Suspense>
            ) : (
              <Suspense fallback={<section className="card account-screen">{t('account.loading')}</section>}>
                {status === 'signed-in'
                  ? <ProfileScreen onClose={() => setActiveTab('today')} />
                  : <>
                    <ProfileDataSections />
                    <LoginScreen onClose={() => setActiveTab('today')} />
                  </>}
              </Suspense>
            )
          ) : activeTab === 'progress' ? (
            demoMode && !demoHistoryReady ? (
              <section className="card" aria-live="polite">
                <p className="empty-state">{t('demo.loadingHistory')}</p>
              </section>
            ) : (
              <Suspense fallback={<section className="card">{t('app.loadingProgress')}</section>}>
                <ProgressScreen
                  entries={history}
                  exercises={exercises}
                  authStatus={status}
                  initialExerciseId={progressExerciseId || undefined}
                  onDeleteEntry={async (entryId) => setHistory(await deleteWorkoutEntry(entryId))}
                  onRestoreEntry={async (entry) => setHistory(restoreWorkoutEntry(entry))}
                  onOpenExercise={(exerciseId) => {
                    setSelectedId(exerciseId)
                    setExerciseMode('lookup')
                    setActiveTab('exercises')
                  }}
                  onSignIn={() => setActiveTab('you')}
                />
              </Suspense>
            )
          ) : activeTab === 'today' ? (
            demoMode && !demoHistoryReady ? (
              <section className="card" aria-live="polite">
                <p className="empty-state">{t('demo.loadingHistory')}</p>
              </section>
            ) : (
              <>
                {showWelcome && (
                  <section className="card welcome-card" aria-labelledby="welcome-title">
                    <h2 id="welcome-title">{t('welcome.title')}</h2>
                    <ul>
                      <li>{t('welcome.plan')}</li>
                      <li>{t('welcome.log')}</li>
                      <li>{t('welcome.track')}</li>
                    </ul>
                    <div className="welcome-actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {
                          dismissWelcome()
                          setShowWelcome(false)
                        }}
                      >
                        {t('welcome.gotIt')}
                      </button>
                      {!demoMode && <a className="secondary-button" href="?demo=1">{t('welcome.demo')}</a>}
                    </div>
                  </section>
                )}
                <WorkoutPlan mode="preset" lockMode authStatus={status} onSignIn={() => setActiveTab('you')} onStartRest={startRest} />
              </>
            )
          ) : exerciseMode === 'custom' ? (
            <WorkoutPlan mode="custom" lockMode authStatus={status} onSignIn={() => setActiveTab('you')} onStartRest={startRest} />
          ) : (
            <>
              <section className="card search-panel">
                <label className="field-label" htmlFor="exercise-search">{t('exercises.searchLabel')}</label>
                <div className="region-chips" role="group" aria-label={t('exercises.bodyRegion')}>
                  {availableBodyRegions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      className={bodyRegion === region ? 'region-chip active' : 'region-chip'}
                      aria-pressed={bodyRegion === region}
                      onClick={() => setBodyRegion(region)}
                    >
                      {t(`region.${region}` as TranslationKey)}
                    </button>
                  ))}
                </div>
                <div className="search-shell">
                  <input
                    id="exercise-search"
                    className="search-input"
                    type="search"
                    placeholder={t('exercises.searchPlaceholder')}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />

                  {(search.trim() || bodyRegion !== ALL_BODY_REGIONS) && (
                    <ExerciseSearchSuggestions
                      exercises={filteredExercises}
                      selectedExerciseId={selectedExercise?.id}
                      onSelect={(exerciseId) => {
                        setSelectedId(exerciseId)
                        setSearch('')
                      }}
                    />
                  )}
                </div>
              </section>

              {selectedExercise ? (
                <>
                  <section className="card exercise-card">
                    <div className="exercise-header">
                      <div>
                        <p className="field-label">{t('exercises.exercise')}</p>
                        <h2>
                          <a
                            className="exercise-image-link"
                            href={exerciseImageSearchUrl(exerciseImageQuery(selectedExercise.id, getExerciseDisplayName(selectedExercise), selectedExercise.equipment))}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t('exercises.seeImages', { name: getExerciseDisplayName(selectedExercise, language) })}
                            onClick={(event) => {
                              event.preventDefault()
                              void openExternal(event.currentTarget.href)
                            }}
                          >
                            {getExerciseDisplayName(selectedExercise, language)}
                            <svg className="exercise-image-link-icon" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M8 16L16 8" />
                              <path d="M9.5 8H16v6.5" />
                            </svg>
                          </a>
                        </h2>
                      </div>
                    </div>

                    {selectedExercise.primaryMuscles !== undefined || selectedExercise.secondaryMuscles !== undefined ? (
                      <div className="muscle-groups">
                        <div className="muscle-group">
                          <span className="field-label">{t('exercises.primaryMuscles')}</span>
                          <div className="chip-row muscle-chip-row">
                            {(selectedExercise.primaryMuscles ?? [selectedExercise.primaryMuscle]).map((muscle) => (
                              <span key={muscle} className="chip">{localizeMuscle(muscle, language)}</span>
                            ))}
                          </div>
                        </div>
                        <div className="muscle-group">
                          <span className="field-label">{t('exercises.secondaryMuscles')}</span>
                          <div className="chip-row muscle-chip-row">
                            {(selectedExercise.secondaryMuscles ??
                              (selectedExercise.secondaryMuscle ? [selectedExercise.secondaryMuscle] : [])
                            ).map((muscle) => (
                              <span key={muscle} className="chip subtle">{localizeMuscle(muscle, language)}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="chip-row">
                        <span className="chip">{localizeMuscle(selectedExercise.primaryMuscle, language)}</span>
                        {selectedExercise.secondaryMuscle && <span className="chip subtle">{localizeMuscle(selectedExercise.secondaryMuscle, language)}</span>}
                      </div>
                    )}

                    {selectedExercise.notes && <p className="exercise-notes">{selectedExercise.notes}</p>}

                    <SqueezeCue
                      cue={selectedExercise.squeezeCue}
                      cueLabel={t('workout.squeezeCue')}
                      tips={selectedExerciseTips.map((tip) => (typeof tip === 'string' ? tip : tip.text))}
                      tipsLabel={t('exercises.postureTips')}
                      tipsId={`track-posture-tips-${selectedExercise.id}`}
                      expanded={tipsExpanded}
                      onToggle={() => setTipsExpanded((current) => !current)}
                    />

                    <div className="summary-grid">
                      <div className="metric-card">
                        <span>{t('exercises.lastMax')}</span>
                        <strong>{previousMax ? `${previousMax} kg` : '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span>{t('exercises.lastVolume')}</span>
                        <strong>{previousVolume ? `${previousVolume} kg` : '—'}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="card previous-card">
                    <div className="section-title-row">
                      <h3>{t('exercises.previousPerformance')}</h3>
                    </div>

                    {previousWorkout ? (
                      <>
                        <div className="last-session-line">
                          <span>{formatShortDate(language, previousWorkout.date)}</span>
                          <strong>
                            {previousWorkout.sets.length} {previousWorkout.sets.length === 1 ? t('exercises.setOne') : t('exercises.setMany')}
                          </strong>
                        </div>
                        <div className="last-sets">
                          {previousWorkout.sets.map((set, index) => (
                            <span key={`${previousWorkout.id}-${index}`}>
                              <strong>{index + 1}</strong> {formatWorkoutSet(set)}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="empty-state">{t('exercises.noPrevious')}</p>
                    )}
                  </section>

                  <section className="card log-card">
                    <div className="section-title-row">
                      <h3>{t('exercises.trackTitle')}</h3>
                    </div>

                    <ExerciseSetTable
                      sets={draftSets}
                      previousSets={previousSets}
                      completedSets={completedSets}
                      onUpdateSet={updateSet}
                      onToggleComplete={(index) =>
                        setCompletedSets((current) => current.map((complete, setIndex) => setIndex === index ? !complete : complete))
                      }
                      onRemoveSet={removeSet}
                    />

                    <div className="action-row">
                      <button type="button" className="secondary-button" onClick={addSet}>
                        {t('exercises.addSet')}
                      </button>
                    </div>

                    <label className="field-label" htmlFor="workout-notes">{t('exercises.notes')}</label>
                    <textarea
                      id="workout-notes"
                      className="notes-input"
                      rows={3}
                      value={draftNotes}
                      onChange={(event) => setDraftNotes(event.target.value)}
                      placeholder={t('exercises.notesPlaceholder')}
                    />

                    {saveError && <p role="alert" className="account-error">{saveError}</p>}

                    <button type="button" className="primary-button" onClick={saveWorkout}>
                      {t('exercises.logWorkout')}
                    </button>
                  </section>

                  <section className="card progress-card">
                    <div className="section-title-row">
                      <h3>{t('exercises.progress')}</h3>
                      <button
                        type="button"
                        className="toggle-button"
                        onClick={() => {
                          setProgressExerciseId(selectedExercise.id)
                          setActiveTab('progress')
                        }}
                      >
                        {t('exercises.seeFullProgress')}
                      </button>
                    </div>

                    {progressItems.length > 0 ? (
                      <div className="progress-list">
                        {progressItems.map((item) => (
                          <div className="progress-item" key={item.id}>
                            <div>
                              <span>{formatShortDate(language, item.date)}</span>
                              <strong>{item.maxWeight} kg</strong>
                            </div>
                            <small>{t('exercises.volumeSuffix', { value: item.totalVolume })}</small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">{t('exercises.noTrend')}</p>
                    )}
                  </section>
                </>
              ) : (
                <section className="card">
                  <p className="empty-state">{t('exercises.empty')}</p>
                </section>
              )}
            </>
          )}
          </div>
        </main>
        <nav className={`bottom-tab-bar${dockHidden ? ' hidden' : ''}`} aria-label={t('nav.aria')}>
          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'exercises') {
                  setExerciseMode('lookup')
                  void loadWorkoutHistory().then(setHistory)
                }
                if (tab.id === 'progress') {
                  setProgressExerciseId('')
                  void loadWorkoutHistory().then(setHistory)
                }
              }}
            >
              <NavigationIcon name={tab.icon} />
              <span className="visually-hidden">{t(tab.labelKey)}</span>
            </button>
          ))}
        </nav>
        <RestTimer timer={restTimer} hidden={dockHidden} onChange={updateRestTimer} />
        <HelpAndAi
          activeTab={activeTab}
          hidden={dockHidden}
          showPulse={showHelpPulse}
          onSignIn={() => setActiveTab('you')}
        />
        {saveConfirmation && (
          <div className="log-toast" role="status" aria-live="polite">
            <span>{saveConfirmation}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function NavigationIcon({ name }: { name: (typeof navigationTabs)[number]['icon'] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'home' ? (
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-6h-4v6H4a1 1 0 0 1-1-1z" />
      ) : name === 'search' ? (
        <>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 5 5" />
        </>
      ) : name === 'chart' ? (
        <>
          <path d="M3 3v18h18" />
          <path d="m7 14 4-4 3 3 6-7" />
        </>
      ) : (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
    </svg>
  )
}
