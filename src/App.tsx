import React, { useEffect, useMemo, useState } from 'react'
import WorkoutPlan from './components/WorkoutPlan'
import { Exercise, ExerciseTip, WorkoutEntry, WorkoutSet } from './types'
import {
  getExerciseDisplayName,
  loadExercises,
  loadWorkoutHistory,
  refreshCatalogue,
  saveWorkoutHistory,
} from './utils/storage'
import {
  ALL_BODY_REGIONS,
  filterExercises,
  getAvailableBodyRegions,
  getExerciseTips,
} from './utils/exerciseFilters'

type ViewTab = 'track' | 'planned' | 'custom'

const uiText = {
  title: 'Gym Studio',
  subtitle: 'Performance tracking',
  track: 'Track it as you go',
  planned: 'Planned before you go',
  customPlan: 'Make your plan',
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
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [history, setHistory] = useState<WorkoutEntry[]>([])
  const [search, setSearch] = useState('')
  const [bodyRegion, setBodyRegion] = useState(ALL_BODY_REGIONS)
  const [selectedId, setSelectedId] = useState<string>('')
  const [draftSets, setDraftSets] = useState<WorkoutSet[]>([createSet(8, 0), createSet(8, 0)])
  const [draftNotes, setDraftNotes] = useState('')
  const [tipsExpanded, setTipsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<ViewTab>('track')
  const text = uiText

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const refresh = refreshCatalogue()
      const cachedExercises = await loadExercises(false)
      if (cancelled) return
      if (cachedExercises.length) {
        setExercises(cachedExercises)
        setHistory(await loadWorkoutHistory())
      }

      const refreshedCatalogue = await refresh
      if (!refreshedCatalogue?.length && !cachedExercises.length) {
        const [offlineExercises, offlineHistory] = await Promise.all([loadExercises(), loadWorkoutHistory()])
        if (cancelled) return
        setExercises(offlineExercises)
        setHistory(offlineHistory)
        return
      }
      if (!refreshedCatalogue?.length || cancelled) return

      const [updatedExercises, updatedHistory] = await Promise.all([loadExercises(false), loadWorkoutHistory()])
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

  useEffect(() => {
    if (!selectedId && exercises.length) {
      setSelectedId(exercises.find((exercise) => exercise.id === 'barbell-bench-press')?.id ?? exercises[0].id)
    }
  }, [exercises, selectedId])

  useEffect(() => {
    if (!selectedExercise) return
    setDraftSets([createSet(8, 0), createSet(8, 0)])
    setDraftNotes('')
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
    ? previousWorkout.sets.reduce((total, set) => total + set.reps * set.weight, 0)
    : 0
  const previousMax = previousWorkout
    ? Math.max(...previousWorkout.sets.map((set) => set.weight), 0)
    : 0

  const progressItems = exerciseHistory.slice(0, 5).map((entry) => ({
    id: entry.id,
    date: entry.date,
    maxWeight: Math.max(...entry.sets.map((set) => set.weight), 0),
    totalVolume: entry.sets.reduce((total, set) => total + set.reps * set.weight, 0),
  }))

  const updateSet = (index: number, field: 'reps' | 'weight', value: string) => {
    setDraftSets((current) =>
      current.map((set, setIndex) => {
        if (setIndex !== index) return set

        return {
          ...set,
          [field]: Number(value) || 0,
        }
      })
    )
  }

  const addSet = () => {
    setDraftSets((current) => [...current, createSet(8, 0)])
  }

  const removeSet = (setId: string) => {
    setDraftSets((current) => (current.length > 1 ? current.filter((set) => set.id !== setId) : current))
  }

  const saveWorkout = () => {
    if (!selectedExercise) return

    const validSets = draftSets
      .map((set) => ({
        ...set,
        reps: Number(set.reps) || 0,
        weight: Number(set.weight) || 0,
      }))
      .filter((set) => set.reps > 0 || set.weight > 0)

    if (validSets.length === 0) return

    const nextEntry: WorkoutEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      exerciseId: selectedExercise.id,
      date: new Date().toISOString().slice(0, 10),
      sets: validSets,
      notes: draftNotes.trim() || undefined,
    }

    const nextHistory = [nextEntry, ...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    setDraftSets([createSet(8, 0), createSet(8, 0)])
    setDraftNotes('')
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <header className="brand-header">
          <div className="brand-row">
            <span className="brand-mark">BF</span>
            <span className="brand-name">Borcelle Fitness</span>
          </div>
          <div className="header-row-with-toggle">
            <h1>{text.title}</h1>
          </div>
          <p className="eyebrow">{text.subtitle}</p>
          <div className="tab-row" aria-label="Workout tabs">
            <button
              type="button"
              className={activeTab === 'track' ? 'tab-button active' : 'tab-button'}
              onClick={() => {
                setActiveTab('track')
                void loadWorkoutHistory().then(setHistory)
              }}
            >
              {text.track}
            </button>
            <button
              type="button"
              className={activeTab === 'planned' ? 'tab-button active' : 'tab-button'}
              onClick={() => setActiveTab('planned')}
            >
              {text.planned}
            </button>
            <button
              type="button"
              className={activeTab === 'custom' ? 'tab-button active' : 'tab-button'}
              onClick={() => setActiveTab('custom')}
            >
              {text.customPlan}
            </button>
          </div>
        </header>

        <main className="app-content">
          {activeTab === 'track' ? (
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
                            <span className="result-meta">
                              {[exercise.bodyRegion, (exercise.primaryMuscles ?? [exercise.primaryMuscle]).join(', ')]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
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

                    {getExerciseTips(selectedExercise).length ? (
                      <div className={`tips-box ${tipsExpanded ? 'expanded' : 'collapsed'}`}>
                        <div className="tips-header">
                          <p className="field-label">{text.postureTips}</p>
                          <button
                            type="button"
                            className="toggle-button expand-toggle"
                            onClick={() => setTipsExpanded((current) => !current)}
                            aria-expanded={tipsExpanded}
                          >
                            {tipsExpanded ? '−' : '+'}
                          </button>
                        </div>

                        <ul className="tips-list">
                          {(tipsExpanded
                            ? getExerciseTips(selectedExercise)
                            : getExerciseTips(selectedExercise).slice(0, 1)
                          ).map((tip, index) => (
                            <li key={`${selectedExercise.id}-tip-${index}`} className="tip-item">
                              {typeof tip === 'string' ? tip : tip.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

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
                              <strong>{index + 1}</strong> {set.reps} × {set.weight} kg
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

                    <button type="button" className="primary-button" onClick={saveWorkout}>
                      {text.saveWorkout}
                    </button>
                  </section>

                  <section className="card progress-card">
                    <div className="section-title-row">
                      <h3>{text.progress}</h3>
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
          ) : activeTab === 'planned' ? (
            <WorkoutPlan mode="preset" lockMode />
          ) : (
            <WorkoutPlan mode="custom" lockMode />
          )}
        </main>
      </div>
    </div>
  )
}
