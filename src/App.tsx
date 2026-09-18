import React, { useEffect, useMemo, useState } from 'react'
import { Exercise, WorkoutEntry, WorkoutSet } from './types'
import { loadExercises, loadWorkoutHistory, saveWorkoutHistory } from './utils/storage'

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

export default function App() {
  const [exercises] = useState<Exercise[]>(() => loadExercises())
  const [history, setHistory] = useState<WorkoutEntry[]>(() => loadWorkoutHistory())
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [draftSets, setDraftSets] = useState<WorkoutSet[]>([createSet(8, 0), createSet(8, 0)])
  const [draftNotes, setDraftNotes] = useState('')
  const [tipsExpanded, setTipsExpanded] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatReply, setChatReply] = useState('')

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedId) ?? exercises[0],
    [exercises, selectedId]
  )

  useEffect(() => {
    if (!selectedId && exercises[0]) {
      setSelectedId(exercises[0].id)
    }
  }, [exercises, selectedId])

  useEffect(() => {
    if (!selectedExercise) return
    setDraftSets([createSet(8, 0), createSet(8, 0)])
    setDraftNotes('')
    setChatInput('')
    setChatReply('')
  }, [selectedExercise])

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return []
    }

    return exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(query) ||
      exercise.primaryMuscle.toLowerCase().includes(query) ||
      (exercise.secondaryMuscle ?? '').toLowerCase().includes(query)
    ).slice(0, 6)
  }, [exercises, search])

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

  const askExerciseQuestion = (customQuestion?: string) => {
    if (!selectedExercise) return

    const question = (customQuestion ?? chatInput).trim()
    if (!question) return

    const normalizeText = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const cleanQuestion = normalizeText(question)
    const exerciseKey = selectedExercise.id

    const answers: Record<string, string[]> = {
      'barbell-bench-press': [
        'La espalda debe estar estable, con pies bien apoyados y omóplatos retraídos.',
        'Siente el esfuerzo principalmente en el pecho y tríceps, no en la zona lumbar.',
        'Baja controlando el peso y mantén los codos en un ángulo cómodo.'
      ],
      'incline-dumbbell-press': [
        'Mantén la espalda pegada al banco y los hombros bajos.',
        'Los codos deben ir ligeramente hacia atrás, no separados en línea recta.',
        'En la bajada, controla el recorrido para no forzar la articulación.'
      ],
      'lat-pulldown': [
        'Tira con el pecho hacia la barra y sin encorvar la zona baja.',
        'El movimiento debe sentirse en la espalda y no solo en los brazos.',
        'Llega con control y vuelve con el peso sin saltar.'
      ],
      'seated-cable-row': [
        'Mantén la espalda recta y la mirada al frente.',
        'Trae la manija hacia la parte baja del abdomen sin redondear la espalda.',
        'No uses impulso del tronco ni levantes la pelvis.'
      ],
      'back-squat': [
        'Los pies deben estar firmes y la mirada al frente.',
        'La rodilla sigue la dirección del dedo del pie y la espalda no se redondea.',
        'Empuja el piso y baja sin perder el centro de gravedad.'
      ],
      'romanian-deadlift': [
        'La zona lumbar debe mantenerse neutra y la mirada al frente.',
        'Los hombros deben bajar y permanecer relajados.',
        'Haz la bajada con cadera y pecho en línea, sin hundir la espalda.'
      ],
      'dumbbell-shoulder-press': [
        'Activa el core y evita balancearte con la cadera.',
        'Los codos no deben caer hacia los lados ni la espalda arquearse.',
        'La prensa debe sentirse en hombros y no en el cuello.'
      ],
      'leg-curl': [
        'Mantén la pelvis estable y la espalda pegada a la máquina.',
        'El esfuerzo debe sentirse en los isquiotibiales, no en la zona lumbar.',
        'Controla la bajada para evitar empujar con la cadera.'
      ]
    }

    const fallback = [
      'Mantén la postura estable, el core activado y el movimiento controlado.',
      'No fuerces la movilidad ni te balancees para levantar más peso.',
      'Si aparece dolor o sensación inestable, reduce carga y corrige la posición.'
    ]

    const answer =
      cleanQuestion.includes('donde') || cleanQuestion.includes('sentir') || cleanQuestion.includes('esfuerzo') || cleanQuestion.includes('duele') || cleanQuestion.includes('trabaja')
        ? (answers[exerciseKey]?.[0] ?? fallback[0])
        : cleanQuestion.includes('postura') || cleanQuestion.includes('forma') || cleanQuestion.includes('correccion') || cleanQuestion.includes('correcta') || cleanQuestion.includes('como')
          ? (answers[exerciseKey]?.[1] ?? fallback[1])
          : cleanQuestion.includes('evitar') || cleanQuestion.includes('error') || cleanQuestion.includes('no') || cleanQuestion.includes('cuidado') || cleanQuestion.includes('mal')
            ? (answers[exerciseKey]?.[2] ?? fallback[2])
            : (answers[exerciseKey]?.[0] ?? fallback[0])

    setChatReply(answer)
    setChatInput('')
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <header className="brand-header">
          <div className="brand-row">
            <span className="brand-mark">BF</span>
            <span className="brand-name">Borcelle Fitness</span>
          </div>
          <h1>Gym Studio</h1>
          <p className="eyebrow">Performance tracking</p>
        </header>

        <main className="app-content">
          <section className="card search-panel">
            <label className="field-label" htmlFor="exercise-search">Search exercise</label>
            <div className="search-shell">
              <input
                id="exercise-search"
                className="search-input"
                type="search"
                placeholder="Bench press, squat, row..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {filteredExercises.length > 0 && (
                <div className="search-dropdown" role="listbox" aria-label="Exercise suggestions">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      className={selectedExercise?.id === exercise.id ? 'result-item active' : 'result-item'}
                      onClick={() => {
                        setSelectedId(exercise.id)
                        setSearch('')
                      }}
                    >
                      <span className="result-name">{exercise.name}</span>
                      <span className="result-meta">
                        {exercise.primaryMuscle}
                        {exercise.secondaryMuscle ? ` · ${exercise.secondaryMuscle}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {selectedExercise ? (
            <>
              <section className="card exercise-card">
                <div className="exercise-header">
                  <div>
                    <p className="field-label">Exercise</p>
                    <h2>{selectedExercise.name}</h2>
                  </div>
                  <span className="date-badge">Today · {formatDate(new Date().toISOString().slice(0, 10))}</span>
                </div>

                <div className="chip-row">
                  <span className="chip">{selectedExercise.primaryMuscle}</span>
                  {selectedExercise.secondaryMuscle && <span className="chip subtle">{selectedExercise.secondaryMuscle}</span>}
                </div>

                {selectedExercise.notes && <p className="exercise-notes">{selectedExercise.notes}</p>}

                {selectedExercise.tips?.length ? (
                  <div className={`tips-box ${tipsExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="tips-header">
                      <p className="field-label">Posture tips</p>
                      <button
                        type="button"
                        className="expand-toggle"
                        onClick={() => setTipsExpanded((current) => !current)}
                        aria-expanded={tipsExpanded}
                      >
                        {tipsExpanded ? 'Hide' : 'Expand'}
                      </button>
                    </div>

                    <ul className="tips-list">
                      {(tipsExpanded ? selectedExercise.tips : selectedExercise.tips.slice(0, 1)).map((tip, index) => (
                        <li key={`${selectedExercise.id}-tip-${index}`}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="summary-grid">
                  <div className="metric-card">
                    <span>Last max</span>
                    <strong>{previousMax ? `${previousMax} kg` : '—'}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Last volume</span>
                    <strong>{previousVolume ? `${previousVolume} kg` : '—'}</strong>
                  </div>
                </div>
              </section>

              <section className="card previous-card">
                <div className="section-title-row">
                  <h3>Previous performance</h3>
                </div>

                {previousWorkout ? (
                  <>
                    <div className="last-session-line">
                      <span>{formatDate(previousWorkout.date)}</span>
                      <strong>{previousWorkout.sets.length} sets</strong>
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
                  <p className="empty-state">No previous workout recorded yet.</p>
                )}
              </section>

              <section className="card log-card">
                <div className="section-title-row">
                  <h3>Log workout</h3>
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
                      Remove
                    </button>
                  </div>
                ))}

                <div className="action-row">
                  <button type="button" className="secondary-button" onClick={addSet}>
                    + Add set
                  </button>
                </div>

                <label className="field-label" htmlFor="workout-notes">Notes</label>
                <textarea
                  id="workout-notes"
                  className="notes-input"
                  rows={3}
                  value={draftNotes}
                  onChange={(event) => setDraftNotes(event.target.value)}
                  placeholder="How did it feel? Any adjustments?"
                />

                <button type="button" className="primary-button" onClick={saveWorkout}>
                  Save workout
                </button>
              </section>

              <section className="card progress-card">
                <div className="section-title-row">
                  <h3>Progress</h3>
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
                  <p className="empty-state">Your trend will appear here as you log workouts.</p>
                )}
              </section>
            </>
          ) : (
            <section className="card">
              <p className="empty-state">Selecciona un ejercicio para empezar.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
