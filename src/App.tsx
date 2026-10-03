import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WorkoutPlan from './components/WorkoutPlan'
import RestTimer from './components/RestTimer'
import AskExercise from './components/AskExercise'
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
  refreshCatalogue,
  saveWorkoutHistory,
  saveRestTimerState,
} from './utils/storage'
import { RestTimerState, startRestTimer } from './utils/restTimer'
import {
  ALL_BODY_REGIONS,
  filterExercises,
  getAvailableBodyRegions,
  getExerciseSubtitle,
  getExerciseTips,
} from './utils/exerciseFilters'
import {
  copyWeightToUntouchedSets,
  filterLoggableSets,
  formatWorkoutSet,
  workoutMaxWeight,
  workoutVolume,
} from './utils/workoutSets'

const LoginScreen = lazy(() => import('./screens/LoginScreen'))
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'))
const ProgressScreen = lazy(() => import('./screens/ProgressScreen'))

const uiText = {
  searchLabel: 'Search exercise',
  searchPlaceholder: 'Bench press, squat, row...',
  exercise: 'Exercise',
  today: 'Today',
  postureTips: 'Posture tips',
  lastMax: 'Last max',
  lastVolume: 'Last volume',
  previousPerformance: 'Previous performance',
  sets: 'sets',
  trackTitle: 'Track it as you go',
  notes: 'Notes',
  notesPlaceholder: 'How did it feel? Any adjustments?',
  saveWorkout: 'Save workout',
  progress: 'Progress',
  noPrevious: 'No previous workout recorded yet.',
  addSet: '+ Add set',
  remove: 'Remove',
  noTrend: 'Your trend will appear here as you log workouts.',
  emptyState: 'Select an exercise to begin.',
} as const

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

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
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
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [history, setHistory] = useState<WorkoutEntry[]>([])
  const [demoHistoryReady, setDemoHistoryReady] = useState(!demoMode)
  const [search, setSearch] = useState('')
  const [bodyRegion, setBodyRegion] = useState(ALL_BODY_REGIONS)
  const [selectedId, setSelectedId] = useState<string>('')
  const [draftSets, setDraftSets] = useState<WorkoutSet[]>([createSet(8, 0), createSet(8, 0)])
  const [setWeightTouched, setSetWeightTouched] = useState<boolean[]>([false, false])
  const [draftNotes, setDraftNotes] = useState('')
  const [tipsExpanded, setTipsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('today')
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(() => loadRestTimerState())
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const headerSentinelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const dockHidden = useTextEntryFocused()
  const [showWelcome, setShowWelcome] = useState(() => !hasDismissedWelcome())
  const [exerciseMode, setExerciseMode] = useState<'lookup' | 'custom'>('lookup')
  const [progressExerciseId, setProgressExerciseId] = useState('')
  const text = uiText

  const updateRestTimer = useCallback((timer: RestTimerState | null) => {
    saveRestTimerState(timer)
    setRestTimer(timer)
  }, [])
  const startRest = useCallback(
    (durationSeconds: number) => updateRestTimer(startRestTimer(durationSeconds)),
    [updateRestTimer]
  )

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
    setSetWeightTouched((current) => [...current, false])
  }

  const removeSet = (setId: string) => {
    setDraftSets((current) => (current.length > 1 ? current.filter((set) => set.id !== setId) : current))
    setSetWeightTouched((current) => {
      const index = draftSets.findIndex((set) => set.id === setId)
      return index < 0 ? current : current.filter((_, setIndex) => setIndex !== index)
    })
  }

  const [saveError, setSaveError] = useState('')

  const saveWorkout = () => {
    if (!selectedExercise) return

    const validSets = filterLoggableSets(draftSets, selectedExercise.equipment)

    if (validSets.length === 0) {
      setSaveError('Enter at least one set')
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
    setDraftSets([createSet(8, 0), createSet(8, 0)])
    setSetWeightTouched([false, false])
    setDraftNotes('')
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <main className={`app-content${restTimer ? ' with-rest-timer' : ''}`} ref={contentRef}>
          <div className="header-sentinel" ref={headerSentinelRef} aria-hidden="true" />
          <div className={`brand-bar${headerCollapsed ? ' collapsed' : ''}`}>
            <span className="brand-bar-title" aria-hidden="true">
              <span className="brand-bar-wordmark">Gym Studio</span>
              <span className="brand-bar-screen">{getNavigationTitle(activeTab)}</span>
            </span>
            <span
              className={`sync-indicator ${status === 'signed-in' ? syncStatus : demoMode ? 'demo' : 'local'}`}
              role="status"
              aria-label={status === 'signed-in' ? `Workout sync: ${syncStatus}` : demoMode ? 'Demo data' : 'Local workout data'}
            />
          </div>
          <header className={`brand-header${headerCollapsed ? ' collapsed' : ''}`}>
            <span className="brand-tagline" aria-hidden="true">Train with intent</span>
            <span className="brand-wordmark" aria-hidden="true">Gym Studio</span>
            <h1>{getNavigationTitle(activeTab)}</h1>
          </header>
          {activeTab === 'exercises' && (
            <div className="exercise-mode-switch" role="group" aria-label="Exercise tools">
              <button
                type="button"
                className={exerciseMode === 'lookup' ? 'active' : ''}
                aria-pressed={exerciseMode === 'lookup'}
                onClick={() => setExerciseMode('lookup')}
              >
                Find an exercise
              </button>
              <button
                type="button"
                className={exerciseMode === 'custom' ? 'active' : ''}
                aria-pressed={exerciseMode === 'custom'}
                onClick={() => setExerciseMode('custom')}
              >
                Build a custom day
              </button>
            </div>
          )}
          {activeTab === 'you' ? (
            demoMode ? (
              <section className="card account-screen">
                <h2>Demo mode</h2>
                <p className="account-message">Demo data — not your real history.</p>
                <button type="button" className="secondary-button" onClick={exitDemoMode}>Exit demo</button>
              </section>
            ) : (
              <Suspense fallback={<section className="card account-screen">Loading account…</section>}>
                {status === 'signed-in'
                  ? <ProfileScreen onClose={() => setActiveTab('today')} />
                  : <LoginScreen onClose={() => setActiveTab('today')} />}
              </Suspense>
            )
          ) : activeTab === 'progress' ? (
            demoMode && !demoHistoryReady ? (
              <section className="card" aria-live="polite">
                <p className="empty-state">Loading demo history…</p>
              </section>
            ) : (
              <Suspense fallback={<section className="card">Loading progress…</section>}>
                <ProgressScreen
                  entries={history}
                  exercises={exercises}
                  initialExerciseId={progressExerciseId || undefined}
                  onOpenExercise={(exerciseId) => {
                    setSelectedId(exerciseId)
                    setExerciseMode('lookup')
                    setActiveTab('exercises')
                  }}
                />
              </Suspense>
            )
          ) : activeTab === 'today' ? (
            demoMode && !demoHistoryReady ? (
              <section className="card" aria-live="polite">
                <p className="empty-state">Loading demo history…</p>
              </section>
            ) : (
              <>
                {showWelcome && (
                  <section className="card welcome-card" aria-labelledby="welcome-title">
                    <h2 id="welcome-title">Welcome to GymStudio</h2>
                    <ul>
                      <li>Follow a training plan built around your week.</li>
                      <li>Log sets, reps, and weight as you train.</li>
                      <li>Track your workouts and progress over time.</li>
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
                        Got it
                      </button>
                      {!demoMode && <a className="secondary-button" href="?demo=1">Try the demo</a>}
                    </div>
                  </section>
                )}
                <WorkoutPlan mode="preset" lockMode onSignIn={() => setActiveTab('you')} onStartRest={startRest} />
              </>
            )
          ) : exerciseMode === 'custom' ? (
            <WorkoutPlan mode="custom" lockMode onSignIn={() => setActiveTab('you')} onStartRest={startRest} />
          ) : (
            <>
              <section className="card search-panel">
                <label className="field-label" htmlFor="exercise-search">{text.searchLabel}</label>
                <div className="region-chips" role="group" aria-label="Body region">
                  {availableBodyRegions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      className={bodyRegion === region ? 'region-chip active' : 'region-chip'}
                      aria-pressed={bodyRegion === region}
                      onClick={() => setBodyRegion(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
                <div className="search-shell">
                  <input
                    id="exercise-search"
                    className="search-input"
                    type="search"
                    placeholder={text.searchPlaceholder}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />

                  {(search.trim() || bodyRegion !== ALL_BODY_REGIONS) && (
                    <div className="search-dropdown" role="listbox" aria-label="Exercise suggestions">
                      {filteredExercises.length ? (
                        filteredExercises.map((exercise) => (
                          <button
                            key={exercise.id}
                            type="button"
                            className={selectedExercise?.id === exercise.id ? 'result-item active' : 'result-item'}
                            onClick={() => {
                              setSelectedId(exercise.id)
                              setSearch('')
                            }}
                          >
                            <span className="result-name">{getExerciseDisplayName(exercise)}</span>
                            <span className="result-meta">{getExerciseSubtitle(exercise)}</span>
                          </button>
                        ))
                      ) : (
                        <p className="empty-state">No exercises found.</p>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {selectedExercise ? (
                <>
                  <section className="card exercise-card">
                    <div className="exercise-header">
                      <div>
                        <p className="field-label">{text.exercise}</p>
                        <h2>{getExerciseDisplayName(selectedExercise)}</h2>
                      </div>
                    </div>

                    {selectedExercise.primaryMuscles !== undefined || selectedExercise.secondaryMuscles !== undefined ? (
                      <div className="muscle-groups">
                        <div className="muscle-group">
                          <span className="field-label">Primary muscles</span>
                          <div className="chip-row muscle-chip-row">
                            {(selectedExercise.primaryMuscles ?? [selectedExercise.primaryMuscle]).map((muscle) => (
                              <span key={muscle} className="chip">{muscle}</span>
                            ))}
                          </div>
                        </div>
                        <div className="muscle-group">
                          <span className="field-label">Secondary muscles</span>
                          <div className="chip-row muscle-chip-row">
                            {(selectedExercise.secondaryMuscles ??
                              (selectedExercise.secondaryMuscle ? [selectedExercise.secondaryMuscle] : [])
                            ).map((muscle) => (
                              <span key={muscle} className="chip subtle">{muscle}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="chip-row">
                        <span className="chip">{selectedExercise.primaryMuscle}</span>
                        {selectedExercise.secondaryMuscle && <span className="chip subtle">{selectedExercise.secondaryMuscle}</span>}
                      </div>
                    )}

                    {selectedExercise.notes && <p className="exercise-notes">{selectedExercise.notes}</p>}

                    {selectedExercise.squeezeCue?.trim() && (
                      <p className="squeeze-cue">
                        <span className="squeeze-cue-label"><span aria-hidden="true">💪</span> Squeeze</span>
                        <span>{selectedExercise.squeezeCue}</span>
                      </p>
                    )}

                    <div className={`tips-box ${tipsExpanded ? 'expanded' : 'collapsed'}`}>
                      <div className="tips-header">
                        <p className="field-label">{text.postureTips}</p>
                        <div className="exercise-ai-controls">
                          {selectedExerciseTips.length > 0 && (
                            <button
                              type="button"
                              className="toggle-button expand-toggle"
                              onClick={() => setTipsExpanded((current) => !current)}
                              aria-expanded={tipsExpanded}
                              aria-controls={`track-posture-tips-${selectedExercise.id}`}
                            >
                              {tipsExpanded ? '−' : '+'}
                            </button>
                          )}
                          <AskExercise
                            exerciseId={selectedExercise.id}
                            exerciseName={getExerciseDisplayName(selectedExercise)}
                            onSignIn={() => setActiveTab('you')}
                          />
                        </div>
                      </div>
                      {selectedExerciseTips.length > 0 && (
                        <ul id={`track-posture-tips-${selectedExercise.id}`} className="tips-list" hidden={!tipsExpanded}>
                          {selectedExerciseTips.map((tip, index) => (
                            <li key={`${selectedExercise.id}-tip-${index}`} className="tip-item">
                              {typeof tip === 'string' ? tip : tip.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="summary-grid">
                      <div className="metric-card">
                        <span>{text.lastMax}</span>
                        <strong>{previousMax ? `${previousMax} kg` : '—'}</strong>
                      </div>
                      <div className="metric-card">
                        <span>{text.lastVolume}</span>
                        <strong>{previousVolume ? `${previousVolume} kg` : '—'}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="card previous-card">
                    <div className="section-title-row">
                      <h3>{text.previousPerformance}</h3>
                    </div>

                    {previousWorkout ? (
                      <>
                        <div className="last-session-line">
                          <span>{formatDate(previousWorkout.date)}</span>
                          <strong>{previousWorkout.sets.length} {text.sets}</strong>
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
                      <p className="empty-state">{text.noPrevious}</p>
                    )}
                  </section>

                  <section className="card log-card">
                    <div className="section-title-row">
                      <h3>{text.trackTitle}</h3>
                    </div>

                    {draftSets.map((set, index) => (
                      <div className="set-row" key={set.id}>
                        <span className="set-label">Set {index + 1}</span>
                        <label className="set-field">
                          <span>Reps</span>
                          <input
                            type="number"
                            min={0}
                            value={set.reps}
                            onChange={(event) => updateSet(index, 'reps', event.target.value)}
                          />
                        </label>
                        <label className="set-field">
                          <span>Weight</span>
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={set.weight}
                            onChange={(event) => updateSet(index, 'weight', event.target.value)}
                          />
                        </label>
                        <button type="button" className="remove-set-button" onClick={() => removeSet(set.id)}>
                          {text.remove}
                        </button>
                      </div>
                    ))}

                    <div className="action-row">
                      <button type="button" className="secondary-button" onClick={addSet}>
                        {text.addSet}
                      </button>
                    </div>

                    <label className="field-label" htmlFor="workout-notes">{text.notes}</label>
                    <textarea
                      id="workout-notes"
                      className="notes-input"
                      rows={3}
                      value={draftNotes}
                      onChange={(event) => setDraftNotes(event.target.value)}
                      placeholder={text.notesPlaceholder}
                    />

                    {saveError && <p role="alert" className="account-error">{saveError}</p>}

                    <button type="button" className="primary-button" onClick={saveWorkout}>
                      {text.saveWorkout}
                    </button>
                  </section>

                  <section className="card progress-card">
                    <div className="section-title-row">
                      <h3>{text.progress}</h3>
                      <button
                        type="button"
                        className="toggle-button"
                        onClick={() => {
                          setProgressExerciseId(selectedExercise.id)
                          setActiveTab('progress')
                        }}
                      >
                        See full progress
                      </button>
                    </div>

                    {progressItems.length > 0 ? (
                      <div className="progress-list">
                        {progressItems.map((item) => (
                          <div className="progress-item" key={item.id}>
                            <div>
                              <span>{formatDate(item.date)}</span>
                              <strong>{item.maxWeight} kg</strong>
                            </div>
                            <small>{item.totalVolume} kg volume</small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">{text.noTrend}</p>
                    )}
                  </section>
                </>
              ) : (
                <section className="card">
                  <p className="empty-state">{text.emptyState}</p>
                </section>
              )}
            </>
          )}
        </main>
        <nav className={`bottom-tab-bar${dockHidden ? ' hidden' : ''}`} aria-label="Primary navigation">
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
              <span className="visually-hidden">{tab.label}</span>
            </button>
          ))}
        </nav>
        <RestTimer timer={restTimer} hidden={dockHidden} onChange={updateRestTimer} />
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
