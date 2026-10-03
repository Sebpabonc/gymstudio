import React, { useEffect, useMemo, useState } from 'react'
import { Exercise, WorkoutEntry, WorkoutSet } from '../types'
import {
  getExerciseDisplayName,
  loadExercises,
  loadWorkoutHistory,
  normalizeExerciseName,
  saveWorkoutHistory,
  upsertExerciseRecord,
} from '../utils/storage'

type PlannedExercise = {
  name: string
  sets?: string
  reps?: string
  rest: string
  focus: string
  goal: string
  tip: string
}

type PlannedDay = {
  id: string
  label: string
  title: string
  summary: string
  exercises: PlannedExercise[]
}

type PlanMode = 'preset' | 'custom'

const CUSTOM_PLAN_KEY = 'gym-studio.custom-plan'

const defaultCustomExercise: PlannedExercise = {
  name: '',
  sets: '3',
  reps: '8-10',
  rest: "1'30\"",
  focus: 'General',
  goal: '',
  tip: '',
}

function loadCustomPlan(): PlannedExercise[] {
  const raw = localStorage.getItem(CUSTOM_PLAN_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        name: typeof item?.name === 'string' ? item.name.trim() : '',
        sets: typeof item?.sets === 'string' ? item.sets : '3',
        reps: typeof item?.reps === 'string' ? item.reps : '8-10',
        rest: typeof item?.rest === 'string' ? item.rest : "1'30\"",
        focus: typeof item?.focus === 'string' ? item.focus : 'General',
        goal: typeof item?.goal === 'string' ? item.goal : '',
        tip: typeof item?.tip === 'string' ? item.tip : '',
      }))
      .filter((item) => item.name.length > 0)
  } catch {
    return []
  }
}

function saveCustomPlan(exercises: PlannedExercise[]) {
  localStorage.setItem(CUSTOM_PLAN_KEY, JSON.stringify(exercises))
}

function createTipIllustration(muscle: string, variant: number) {
  const palette: Record<string, { body: string; accent: string; glow: string }> = {
    Chest: { body: '#ff7b72', accent: '#ffd166', glow: '#fff5c7' },
    Back: { body: '#60a5fa', accent: '#a78bfa', glow: '#dbeafe' },
    Legs: { body: '#34d399', accent: '#fbbf24', glow: '#d1fae5' },
    Shoulders: { body: '#fbbf24', accent: '#f97316', glow: '#fef3c7' },
    Triceps: { body: '#c084fc', accent: '#f9a8d4', glow: '#f3e8ff' },
    Biceps: { body: '#f472b6', accent: '#fb7185', glow: '#fce7f3' },
    Calves: { body: '#a3e635', accent: '#facc15', glow: '#ecfccb' },
    Hamstrings: { body: '#34d399', accent: '#fb7185', glow: '#d1fae5' },
    Quads: { body: '#38bdf8', accent: '#22d3ee', glow: '#dff7ff' },
    Core: { body: '#38bdf8', accent: '#22d3ee', glow: '#dff7ff' },
  }

  const colors = palette[muscle] ?? palette.Back
  const sway = variant % 2 === 0 ? -10 : 10
  const scale = variant % 2 === 0 ? '0.98' : '1.02'

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="bg-${variant}" x1="0" x2="1">
          <stop offset="0%" stop-color="#191e27"/>
          <stop offset="100%" stop-color="#2a313c"/>
        </linearGradient>
      </defs>
      <g>
        <rect width="320" height="180" rx="22" fill="url(#bg-${variant})"/>
        <circle cx="160" cy="34" r="17" fill="${colors.glow}" opacity="0.9"/>
        <g>
          <path d="M160 52 L160 84" stroke="${colors.glow}" stroke-width="12" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-${sway} 160 90; ${sway} 160 90; -${sway} 160 90" dur="1.8s" repeatCount="indefinite"/>
          </path>
          <path d="M160 64 L120 92 M160 64 L200 92" stroke="${colors.glow}" stroke-width="10" stroke-linecap="round" opacity="0.95">
            <animateTransform attributeName="transform" type="rotate" values="-${sway} 160 90; ${sway} 160 90; -${sway} 160 90" dur="1.8s" repeatCount="indefinite"/>
          </path>
          <path d="M160 84 L136 118 L126 142 M160 84 L184 118 L194 142" stroke="${colors.glow}" stroke-width="9" stroke-linecap="round" opacity="0.95">
            <animateTransform attributeName="transform" type="rotate" values="-${sway} 160 90; ${sway} 160 90; -${sway} 160 90" dur="1.8s" repeatCount="indefinite"/>
          </path>
          <path d="M126 92 Q160 62 194 92" fill="none" stroke="${colors.body}" stroke-width="14" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-${sway} 160 90; ${sway} 160 90; -${sway} 160 90" dur="1.8s" repeatCount="indefinite"/>
          </path>
          <path d="M160 84 L160 118" stroke="${colors.accent}" stroke-width="12" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-${sway} 160 90; ${sway} 160 90; -${sway} 160 90" dur="1.8s" repeatCount="indefinite"/>
          </path>
          <path d="M126 118 L112 138 M194 118 L208 138" stroke="${colors.accent}" stroke-width="9" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" values="-${sway} 160 90; ${sway} 160 90; -${sway} 160 90" dur="1.8s" repeatCount="indefinite"/>
          </path>
          <path d="M130 128 L150 118 M190 128 L170 118" stroke="${colors.body}" stroke-width="7" stroke-linecap="round" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" values="-${sway} 160 90; ${sway} 160 90; -${sway} 160 90" dur="1.8s" repeatCount="indefinite"/>
          </path>
        </g>
        <path d="M108 64 L212 64" stroke="${colors.glow}" stroke-width="2" stroke-dasharray="6 6" opacity="0.8"/>
      </g>
      <animateTransform attributeName="transform" type="scale" values="${scale}; 1; ${scale}" dur="1.8s" repeatCount="indefinite" additive="sum"/>
    </svg>
  `

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const sixDayProgram: PlannedDay[] = [
  {
    id: 'day-1',
    label: 'Day 1',
    title: 'Chest & Back A',
    summary: 'Push + pull focus',
    exercises: [
      { name: 'Dumbbell Press (Neutral Grip, 45°)', sets: '4', reps: '8-10', rest: "1'30\"", focus: 'Chest', goal: 'Keep the shoulder stable and press with control.', tip: 'Keep the shoulder blades packed and the elbows in a safe angle through the press.' },
      { name: 'Dumbbell Press (Neutral Grip, 30°)', sets: '3', reps: '10-12', rest: '10"', focus: 'Chest', goal: 'Stay tight and drive through the floor.', tip: 'Brace the core and avoid arching the low back as you press.' },
      { name: 'Cable Fly (High)', sets: '3', reps: '10-12', rest: "1'", focus: 'Chest', goal: 'Stretch and squeeze with no torso swing.', tip: 'Keep the rib cage down and the movement driven by the chest, not the shoulders.' },
      { name: 'Cable Row (Wide Grip)', sets: '4', reps: '8-10', rest: "1'30\"", focus: 'Back', goal: 'Pull with the elbows and keep the chest tall.', tip: 'Pull the elbow back and avoid shrugging through the top of the rep.' },
      { name: 'Lat Pulldown (Neutral Grip)', sets: '3', reps: '10-12', rest: '10"', focus: 'Back', goal: 'Strong lat contraction with a controlled return.', tip: 'Keep the torso steady and finish the rep by squeezing the lats without leaning back.' },
    ],
  },
  {
    id: 'day-2',
    label: 'Day 2',
    title: 'Arms A',
    summary: 'Shoulders + triceps',
    exercises: [
      { name: 'Shoulder Press Machine (Wide Grip)', sets: '4', reps: '6-8', rest: "1'30\"", focus: 'Shoulders', goal: 'Keep the core braced and avoid leaning back.', tip: 'Keep the rib cage down and let the shoulders do the work instead of the torso.' },
      { name: 'Dumbbell Overhead Press (Neutral Grip)', sets: '3', reps: '8-10', rest: '10"', focus: 'Shoulders', goal: 'Press overhead with a stable base.', tip: 'Brace the abs and keep the glutes tight so the movement stays vertical.' },
      { name: 'Lat Machine (Reverse Grip)', sets: '3', reps: '10-12', rest: '10"', focus: 'Back', goal: 'Drive the elbows and stay stable through the torso.', tip: 'Stay tall and keep the chest up while pulling the elbow down and back.' },
      { name: 'Decline Press (Close Grip)', sets: '4', reps: '8-10', rest: '10"', focus: 'Triceps', goal: 'Press with control and keep elbows tucked.', tip: 'Control the lowering phase and keep the wrists stacked over the elbows.' },
    ],
  },
  {
    id: 'day-3',
    label: 'Day 3',
    title: 'Lower Body A',
    summary: 'Quad + hamstring emphasis',
    exercises: [
      { name: 'Leg Press (Quad Dominant, 45°)', sets: '4', reps: '8-10', rest: "1'30\"", focus: 'Quads', goal: 'Full range and strong control in the lowering phase.', tip: 'Keep the feet stable and drive through the floor without shifting the hips.' },
      { name: 'Walking Lunge (Dumbbell, Long Step)', sets: '3', reps: '10/leg', rest: '10"', focus: 'Legs', goal: 'Stay tall with a full stride and strong balance.', tip: 'Keep the chest lifted and the front knee tracking over the toes.' },
      { name: 'Romanian Deadlift (Barbell)', sets: '4', reps: '6-8', rest: '10"', focus: 'Hamstrings', goal: 'Hinge from the hips with a neutral spine.', tip: 'Push the hips back, keep the back flat, and don’t round the low back.' },
      { name: 'Calf Raise (Leg Press, Neutral)', sets: '4', reps: '12-15', rest: "1'", focus: 'Calves', goal: 'Drive through the whole foot and pause at the top.', tip: 'Use the full range and control the stretch at the bottom before the push.' },
    ],
  },
  {
    id: 'day-4',
    label: 'Day 4',
    title: 'Chest & Back B',
    summary: 'Upper volume block',
    exercises: [
      { name: 'Dumbbell Press (Neutral Grip, 45°)', sets: '4', reps: '8-10', rest: "1'30\"", focus: 'Chest', goal: 'Keep the shoulder blades packed and the tension high.', tip: 'Keep the shoulder blades down and the elbows in a controlled path through the press.' },
      { name: 'Dumbbell Press (Neutral Grip, 30°)', sets: '3', reps: '10-12', rest: '10"', focus: 'Chest', goal: 'Keep a strong midline and smooth tempo.', tip: 'Brace the abs and control the lowering portion without letting the ribs flare.' },
      { name: 'Cable Row (Wide Grip)', sets: '4', reps: '8-10', rest: "1'30\"", focus: 'Back', goal: 'Drive elbows without jerking the torso.', tip: 'Keep the chest lifted and pull the elbows toward the pocket of your torso.' },
      { name: 'Lat Pulldown (Neutral Grip)', sets: '3', reps: '10-12', rest: '10"', focus: 'Back', goal: 'Control the path and squeeze at the bottom.', tip: 'Avoid leaning back and focus on the lats working through the full range.' },
      { name: 'Dumbbell Pullover', sets: '3', reps: '10-12', rest: "1'30\"", focus: 'Back', goal: 'Long stretch with a smooth eccentric.', tip: 'Keep the movement controlled and pause for a second at the bottom stretch.' },
    ],
  },
  {
    id: 'day-5',
    label: 'Day 5',
    title: 'Arms B',
    summary: 'Press + pull volume',
    exercises: [
      { name: 'Shoulder Press Machine (Wide Grip)', sets: '4', reps: '6-8', rest: "1'30\"", focus: 'Shoulders', goal: 'Keep the torso quiet and the press controlled.', tip: 'Brace the abs and let the shoulders work without leaning back into the rack.' },
      { name: 'Dumbbell Overhead Press (Neutral Grip)', sets: '3', reps: '8-10', rest: '10"', focus: 'Shoulders', goal: 'Stable base with active core tension.', tip: 'Keep the rib cage down and the glutes active through the whole rep.' },
      { name: 'Lat Machine (Reverse Grip)', sets: '3', reps: '10-12', rest: '10"', focus: 'Back', goal: 'Strong pull pattern, controlled return.', tip: 'Pull the elbows down and back and don’t let the shoulders roll forward.' },
      { name: 'Decline Press (Close Grip)', sets: '4', reps: '8-10', rest: '10"', focus: 'Triceps', goal: 'Drive through the chest and keep elbows tucked.', tip: 'Keep the wrists straight and control the lowering phase until the elbows are at a safe angle.' },
    ],
  },
  {
    id: 'day-6',
    label: 'Day 6',
    title: 'Lower Body B',
    summary: 'Strength + leg volume',
    exercises: [
      { name: 'Leg Press (Quad Dominant, 45°)', sets: '4', reps: '8-10', rest: "1'30\"", focus: 'Quads', goal: 'Stay controlled through the full ROM.', tip: 'Keep the feet balanced and avoid shifting the knees inward on the way up.' },
      { name: 'Walking Lunge (Dumbbell, Long Step)', sets: '3', reps: '10/leg', rest: '10"', focus: 'Legs', goal: 'Balance, control, and a strong stride.', tip: 'Keep the chest up and let the front knee track over the foot with control.' },
      { name: 'Romanian Deadlift (Barbell)', sets: '4', reps: '6-8', rest: '10"', focus: 'Hamstrings', goal: 'Neutral spine and controlled hinge pattern.', tip: 'Push the hips back and keep the lumbar spine neutral the entire rep.' },
      { name: 'Calf Raise (Leg Press, Neutral)', sets: '4', reps: '12-15', rest: "1'", focus: 'Calves', goal: 'Strong lockout and full stretch each rep.', tip: 'Drive through the whole foot and pause at the top before lowering.' },
    ],
  },
]

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

function formatHistoryDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function splitExerciseTitle(name: string) {
  const openParenIndex = name.indexOf('(')
  const closeParenIndex = name.lastIndexOf(')')

  if (openParenIndex > 0 && closeParenIndex > openParenIndex) {
    const main = name.slice(0, openParenIndex).trim()
    const details = name.slice(openParenIndex + 1, closeParenIndex).trim()
    return { main, details }
  }

  return { main: name, details: '' }
}

function sanitizeLoggedComment(rawNote: string | undefined, fragments: Array<string | undefined>) {
  let text = rawNote?.trim() ?? ''
  if (!text) return ''

  for (const fragment of fragments) {
    const value = fragment?.trim()
    if (!value) continue

    text = text.split(value).join(' ')
  }

  return text.replace(/\s+/g, ' ').trim()
}

export default function WorkoutPlan({
  mode,
  lockMode = false,
}: {
  mode?: PlanMode
  lockMode?: boolean
}) {
  const [planMode, setPlanMode] = useState<PlanMode>(mode ?? 'preset')
  const [selectedDay, setSelectedDay] = useState(sixDayProgram[0].id)
  const [customPlan, setCustomPlan] = useState<PlannedExercise[]>(() => loadCustomPlan())
  const [customExerciseDraft, setCustomExerciseDraft] = useState<PlannedExercise>(defaultCustomExercise)
  const [selectedLibraryExerciseId, setSelectedLibraryExerciseId] = useState('')
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([])
  const [history, setHistory] = useState<WorkoutEntry[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getTodayIsoDate)
  const [plannedDrafts, setPlannedDrafts] = useState<
    Record<string, { reps: number; weight: number; setWeights: number[]; notes: string }>
  >({})
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sixDayProgram.flatMap((day) => day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), true])))
  )
  const [setSectionsVisible, setSetSectionsVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sixDayProgram.flatMap((day) => day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), false])))
  )
  const [progressSectionsVisible, setProgressSectionsVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sixDayProgram.flatMap((day) => day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), false])))
  )
  const [postureTipsVisible, setPostureTipsVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sixDayProgram.flatMap((day) => day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), true])))
  )
  const [activeSetIndexByExercise, setActiveSetIndexByExercise] = useState<Record<string, number>>(() =>
    Object.fromEntries(sixDayProgram.flatMap((day) => day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), 0])))
  )

  const text = {
    title: 'Planned before you go',
    badge: '6 day split',
    sets: 'Sets',
    reps: 'Reps',
    rest: 'Rest',
    setLog: 'Set log',
    progress: 'Progress',
    comments: 'Comments',
    noProgressHistory: 'No historical progress logged yet.',
    ready: 'Ready',
    log: 'Log this exercise',
    posture: 'POSTURE TIPS',
    noData: 'No logged data yet',
    modePreset: '6-day plan',
    modeCustom: 'Make your own plan',
    customTitle: 'Make your own plan',
    customHint: 'Create and save exercises manually.',
    customName: 'Exercise name',
    customSets: 'Sets',
    customReps: 'Reps',
    customRest: 'Rest',
    customFocus: 'Muscle',
    customGoal: 'Goal',
    customTip: 'Tip',
    customAdd: 'Add exercise',
    customLibrary: 'Pick from library',
    customLibraryPlaceholder: 'Select an exercise',
    customAddLibrary: 'Add from library',
    customEmpty: 'No exercises added yet.',
    customRemove: 'Remove',
    customBadge: 'Manual',
    exerciseLabel: 'Exercise',
    calendar: 'Calendar',
    close: 'Close',
    calendarSelect: 'Select date',
    calendarHistory: 'Work done on this day',
    calendarEmpty: 'No workouts logged on this date.',
  }

  const activeDay = useMemo(
    () => sixDayProgram.find((day) => day.id === selectedDay) ?? sixDayProgram[0],
    [selectedDay]
  )

  useEffect(() => {
    if (mode) {
      setPlanMode(mode)
    }
  }, [mode])

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadExercises(), loadWorkoutHistory()]).then(([exercises, entries]) => {
      if (cancelled) return
      setExerciseCatalog(exercises)
      setHistory(entries)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const activeExercises = planMode === 'preset' ? activeDay.exercises : customPlan

  const calendarHistoryItems = useMemo(
    () =>
      history
        .filter((entry) => entry.date === selectedCalendarDate)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((entry) => {
          const exercise = exerciseCatalog.find((item) => item.id === entry.exerciseId)
          const maxWeight = Math.max(...entry.sets.map((set) => set.weight), 0)
          const totalVolume = entry.sets.reduce((total, set) => total + set.reps * set.weight, 0)

          return {
            id: entry.id,
            name: exercise ? getExerciseDisplayName(exercise) : 'Unknown exercise',
            setsCount: entry.sets.length,
            maxWeight,
            totalVolume,
            comments: sanitizeLoggedComment(entry.notes, [
              exercise?.overallStatement,
              exercise?.notes,
              ...(exercise?.tips?.map((tip) => (typeof tip === 'string' ? tip : tip.text)) ?? []),
            ]),
          }
        }),
    [exerciseCatalog, history, selectedCalendarDate]
  )

  const latestProgressByName = useMemo(() => {
    const map = new Map<string, WorkoutEntry>()

    for (const entry of history) {
      const match = exerciseCatalog.find((exercise) => exercise.id === entry.exerciseId)
      if (!match) continue

      const key = normalizeExerciseName(match.name)
      const current = map.get(key)

      if (!current || new Date(entry.date).getTime() > new Date(current.date).getTime()) {
        map.set(key, entry)
      }
    }

    return map
  }, [exerciseCatalog, history])

  const bestProgressByName = useMemo(() => {
    const map = new Map<string, WorkoutEntry>()

    for (const entry of history) {
      const match = exerciseCatalog.find((exercise) => exercise.id === entry.exerciseId)
      if (!match) continue

      const key = normalizeExerciseName(match.name)
      const current = map.get(key)
      const currentBestWeight = current ? Math.max(...current.sets.map((set) => set.weight), 0) : 0
      const nextBestWeight = Math.max(...entry.sets.map((set) => set.weight), 0)

      if (!current || nextBestWeight > currentBestWeight) {
        map.set(key, entry)
      }
    }

    return map
  }, [exerciseCatalog, history])

  const updatePlanDraft = (exerciseName: string, field: 'reps' | 'weight' | 'notes', value: string) => {
    const key = normalizeExerciseName(exerciseName)

    setPlannedDrafts((current) => {
      const currentDraft = current[key] ?? {
        reps: 8,
        weight: 0,
        setWeights: [0],
        notes: '',
      }

      return {
        ...current,
        [key]: {
          ...currentDraft,
          [field]: field === 'notes' ? value : Number(value) || 0,
          setWeights:
            field === 'weight' && currentDraft.setWeights.length > 0
              ? currentDraft.setWeights.map(() => Number(value) || 0)
              : currentDraft.setWeights,
        },
      }
    })
  }

  const updatePlanSetValue = (exerciseName: string, setIndex: number, field: 'reps' | 'weight', value: string, setCount: number = 1) => {
    const key = normalizeExerciseName(exerciseName)

    setPlannedDrafts((current) => {
      const currentDraft = current[key] ?? {
        reps: 8,
        weight: 0,
        setWeights: [0],
        notes: '',
      }

      const nextSetWeights = [...(currentDraft.setWeights.length ? currentDraft.setWeights : [currentDraft.weight])]
      const nextReps = Number(value) || 0

      if (field === 'weight') {
        nextSetWeights[setIndex] = Number(value) || 0
      }

      return {
        ...current,
        [key]: {
          ...currentDraft,
          reps: field === 'reps' ? nextReps : currentDraft.reps,
          weight: field === 'weight' ? nextSetWeights[0] ?? 0 : currentDraft.weight,
          setWeights: field === 'weight' ? nextSetWeights : currentDraft.setWeights,
        },
      }
    })
  }

  const getDefaultRepTarget = (exercise: PlannedExercise) => {
    const raw = exercise.reps ?? '8'
    const match = raw.match(/(\d+)/)
    return match ? Number(match[1]) : 8
  }

  const getDefaultSetCount = (exercise: PlannedExercise) => {
    const raw = exercise.sets ?? '1'
    const match = raw.match(/(\d+)/)
    return match ? Number(match[1]) : 1
  }

  const getDraftForExercise = (exerciseName: string, exercise?: PlannedExercise) => {
    const key = normalizeExerciseName(exerciseName)
    const best = bestProgressByName.get(key)
    const bestWeight = best ? Math.max(...best.sets.map((set) => set.weight), 0) : 0
    const bestReps = best && best.sets.length ? Math.max(...best.sets.map((set) => set.reps), 0) : 8
    const fallbackReps = exercise ? getDefaultRepTarget(exercise) : bestReps
    const fallbackSetCount = exercise ? getDefaultSetCount(exercise) : 1
    const baseSetWeights = Array.from({ length: fallbackSetCount }, () => Number(bestWeight) || 0)

    return (
      plannedDrafts[key] ?? {
        reps: Number(fallbackReps) || 8,
        weight: Number(bestWeight) || 0,
        setWeights: baseSetWeights,
        notes: '',
      }
    )
  }

  const toggleExerciseCollapse = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)

    setCollapsedExercises((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const getPostureTips = (exercise: PlannedExercise) => {
    return [exercise.goal, exercise.tip].filter(Boolean).map((tip) => tip.trim())
  }

  const toggleSetSection = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)

    setSetSectionsVisible((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }))
  }

  const toggleProgressSection = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)

    setProgressSectionsVisible((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }))
  }

  const togglePostureTips = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)

    setPostureTipsVisible((current) => ({
      ...current,
      [key]: !(current[key] ?? true),
    }))
  }

  const toggleAllExercises = () => {
    const nextValue = activeExercises.some(
      (exercise) => !collapsedExercises[normalizeExerciseName(exercise.name)]
    )

    const nextState = activeExercises.reduce<Record<string, boolean>>((acc, exercise) => {
      acc[normalizeExerciseName(exercise.name)] = nextValue
      return acc
    }, {})

    setCollapsedExercises((current) => ({
      ...current,
      ...nextState,
    }))
  }

  const collapseAllExerciseSections = () => {
    const nextCollapsedState = sixDayProgram.flatMap((day) =>
      day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), true] as const)
    )

    const nextSetSectionState = sixDayProgram.flatMap((day) =>
      day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), false] as const)
    )

    const nextActiveSetState = sixDayProgram.flatMap((day) =>
      day.exercises.map((exercise) => [normalizeExerciseName(exercise.name), 0] as const)
    )

    setCollapsedExercises(Object.fromEntries(nextCollapsedState))
    setSetSectionsVisible(Object.fromEntries(nextSetSectionState))
    setProgressSectionsVisible(Object.fromEntries(nextSetSectionState))
    setActiveSetIndexByExercise(Object.fromEntries(nextActiveSetState))
  }

  const logPlannedExercise = async (exercise: PlannedExercise) => {
    const exerciseKey = normalizeExerciseName(exercise.name)

    const canonical = await upsertExerciseRecord({
      name: exercise.name,
      primaryMuscle: exercise.focus,
      notes: exercise.goal,
      tips: [exercise.tip],
    })

    const draft = getDraftForExercise(exercise.name, exercise)
    const repsPerSet = Number(draft.reps) || getDefaultRepTarget(exercise)
    const setCount = getDefaultSetCount(exercise) || 1
    const validSets = Array.from({ length: setCount }, (_, index) => {
      const currentWeight = draft.setWeights?.[index] ?? draft.weight ?? 0
      return createSet(repsPerSet, Number(currentWeight) || 0)
    })

    const nextEntry: WorkoutEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      exerciseId: canonical.id,
      date: new Date().toISOString().slice(0, 10),
      sets: validSets,
      notes: draft.notes?.trim() ?? '',
    }

    const nextHistory = [nextEntry, ...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    setExerciseCatalog(await loadExercises())

    setPlannedDrafts((current) => {
      const currentDraft = current[exerciseKey]

      if (!currentDraft) return current

      return {
        ...current,
        [exerciseKey]: {
          ...currentDraft,
          notes: '',
        },
      }
    })

    setSetSectionsVisible((current) => ({
      ...current,
      [exerciseKey]: false,
    }))

    setProgressSectionsVisible((current) => ({
      ...current,
      [exerciseKey]: true,
    }))

    setActiveSetIndexByExercise((current) => ({
      ...current,
      [exerciseKey]: 0,
    }))
  }

  const updateCustomExerciseDraft = (field: keyof PlannedExercise, value: string) => {
    setCustomExerciseDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const addLibraryExerciseToCustomPlan = () => {
    if (!selectedLibraryExerciseId) return

    const match = exerciseCatalog.find((exercise) => exercise.id === selectedLibraryExerciseId)
    if (!match) return

    const tipText = match.postureTips?.[0] ?? (match.tips?.length
      ? typeof match.tips[0] === 'string'
        ? match.tips[0]
        : match.tips[0].text
      : '')

    const nextExercise: PlannedExercise = {
      name: match.name,
      sets: '3',
      reps: '8-10',
      rest: "1'30\"",
      focus: match.primaryMuscle || 'General',
      goal: match.overallStatement ?? match.notes ?? match.name,
      tip: tipText ?? '',
    }

    const key = normalizeExerciseName(nextExercise.name)
    const alreadyInPlan = customPlan.some((exercise) => normalizeExerciseName(exercise.name) === key)
    if (alreadyInPlan) return

    const nextPlan = [...customPlan, nextExercise]
    setCustomPlan(nextPlan)
    saveCustomPlan(nextPlan)
    setSelectedLibraryExerciseId('')
    setCollapsedExercises((current) => ({ ...current, [key]: true }))
    setSetSectionsVisible((current) => ({ ...current, [key]: false }))
    setProgressSectionsVisible((current) => ({ ...current, [key]: false }))
    setPostureTipsVisible((current) => ({ ...current, [key]: true }))
    setActiveSetIndexByExercise((current) => ({ ...current, [key]: 0 }))
  }

  const addCustomExercise = () => {
    const trimmedName = customExerciseDraft.name.trim()
    if (!trimmedName) return

    const nextExercise: PlannedExercise = {
      ...customExerciseDraft,
      name: trimmedName,
      sets: customExerciseDraft.sets?.trim() || '3',
      reps: customExerciseDraft.reps?.trim() || '8-10',
      rest: customExerciseDraft.rest.trim() || "1'30\"",
      focus: customExerciseDraft.focus.trim() || 'General',
      goal: customExerciseDraft.goal.trim(),
      tip: customExerciseDraft.tip.trim(),
    }

    const nextPlan = [...customPlan, nextExercise]
    const key = normalizeExerciseName(nextExercise.name)

    setCustomPlan(nextPlan)
    saveCustomPlan(nextPlan)
    setCustomExerciseDraft(defaultCustomExercise)
    setCollapsedExercises((current) => ({ ...current, [key]: true }))
    setSetSectionsVisible((current) => ({ ...current, [key]: false }))
    setProgressSectionsVisible((current) => ({ ...current, [key]: false }))
    setPostureTipsVisible((current) => ({ ...current, [key]: true }))
    setActiveSetIndexByExercise((current) => ({ ...current, [key]: 0 }))
  }

  const removeCustomExercise = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)
    const nextPlan = customPlan.filter((exercise) => normalizeExerciseName(exercise.name) !== key)

    setCustomPlan(nextPlan)
    saveCustomPlan(nextPlan)

    setCollapsedExercises((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })

    setSetSectionsVisible((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })

    setProgressSectionsVisible((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })

    setPostureTipsVisible((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })

    setActiveSetIndexByExercise((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  return (
    <div className="card plan-card">
      <div className="section-title-row">
        <h3>{text.title}</h3>
        <div className="plan-header-actions">
          <button
            type="button"
            className="calendar-icon-button"
            onClick={() => setCalendarOpen((current) => !current)}
            aria-label={text.calendar}
            aria-expanded={calendarOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="plan-badge">{planMode === 'preset' ? text.badge : text.customBadge}</span>
        </div>
      </div>

      {calendarOpen && (
        <div className="calendar-popover" role="presentation" onClick={() => setCalendarOpen(false)}>
          <section
            className="calendar-popover-card"
            aria-label={text.calendar}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="calendar-popover-header">
              <strong>{text.calendar}</strong>
              <button type="button" className="toggle-button" onClick={() => setCalendarOpen(false)}>
                {text.close}
              </button>
            </div>

            <label className="calendar-field">
              <span>{text.calendarSelect}</span>
              <input
                type="date"
                value={selectedCalendarDate}
                onChange={(event) => setSelectedCalendarDate(event.target.value)}
              />
            </label>

            <div className="calendar-history">
              <strong>{text.calendarHistory}</strong>
              {calendarHistoryItems.length > 0 ? (
                <div className="calendar-history-list">
                  {calendarHistoryItems.map((item) => (
                    <article key={item.id} className="calendar-history-item">
                      <div className="calendar-history-row">
                        <span>{item.name}</span>
                        <strong>{item.maxWeight} kg</strong>
                      </div>
                      <div className="calendar-history-row muted-row">
                        <small>{item.totalVolume} kg volume</small>
                        <small>{item.setsCount} sets</small>
                      </div>
                      {item.comments ? <p>{item.comments}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">{text.calendarEmpty}</p>
              )}
            </div>
          </section>
        </div>
      )}

      {!lockMode && (
        <div className="plan-mode-tabs" aria-label="Planning mode">
          <button
            type="button"
            className={planMode === 'preset' ? 'tab-button active' : 'tab-button'}
            onClick={() => setPlanMode('preset')}
          >
            {text.modePreset}
          </button>
          <button
            type="button"
            className={planMode === 'custom' ? 'tab-button active' : 'tab-button'}
            onClick={() => setPlanMode('custom')}
          >
            {text.modeCustom}
          </button>
        </div>
      )}

      {planMode === 'preset' ? (
        <div className="day-tabs" aria-label="Workout days">
          {sixDayProgram.map((day) => (
            <button
              key={day.id}
              type="button"
              className={day.id === selectedDay ? 'day-tab active' : 'day-tab'}
              onClick={() => {
                setSelectedDay(day.id)
                collapseAllExerciseSections()
              }}
            >
              <span className="day-tab-label">{day.label}</span>
              {day.id === selectedDay && <span className="day-tab-summary">{day.summary}</span>}
            </button>
          ))}
        </div>
      ) : (
        <section className="custom-plan-builder">
          <div className="custom-plan-header">
            <strong>{text.customTitle}</strong>
            <p>{text.customHint}</p>
          </div>

          <div className="custom-library-row">
            <label>
              <span>{text.customLibrary}</span>
              <select
                value={selectedLibraryExerciseId}
                onChange={(event) => setSelectedLibraryExerciseId(event.target.value)}
              >
                <option value="">{text.customLibraryPlaceholder}</option>
                {exerciseCatalog
                  .slice()
                  .sort((a, b) =>
                    getExerciseDisplayName(a).localeCompare(getExerciseDisplayName(b))
                  )
                  .map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {getExerciseDisplayName(exercise)}
                    </option>
                  ))}
              </select>
            </label>
            <button type="button" className="secondary-button" onClick={addLibraryExerciseToCustomPlan}>
              {text.customAddLibrary}
            </button>
          </div>

          <div className="custom-plan-grid">
            <label>
              <span>{text.customName}</span>
              <input
                type="text"
                value={customExerciseDraft.name}
                onChange={(event) => updateCustomExerciseDraft('name', event.target.value)}
              />
            </label>
            <label>
              <span>{text.customSets}</span>
              <input
                type="text"
                value={customExerciseDraft.sets}
                onChange={(event) => updateCustomExerciseDraft('sets', event.target.value)}
              />
            </label>
            <label>
              <span>{text.customReps}</span>
              <input
                type="text"
                value={customExerciseDraft.reps}
                onChange={(event) => updateCustomExerciseDraft('reps', event.target.value)}
              />
            </label>
            <label>
              <span>{text.customRest}</span>
              <input
                type="text"
                value={customExerciseDraft.rest}
                onChange={(event) => updateCustomExerciseDraft('rest', event.target.value)}
              />
            </label>
            <label>
              <span>{text.customFocus}</span>
              <input
                type="text"
                value={customExerciseDraft.focus}
                onChange={(event) => updateCustomExerciseDraft('focus', event.target.value)}
              />
            </label>
            <label>
              <span>{text.customGoal}</span>
              <input
                type="text"
                value={customExerciseDraft.goal}
                onChange={(event) => updateCustomExerciseDraft('goal', event.target.value)}
              />
            </label>
            <label className="custom-plan-full">
              <span>{text.customTip}</span>
              <input
                type="text"
                value={customExerciseDraft.tip}
                onChange={(event) => updateCustomExerciseDraft('tip', event.target.value)}
              />
            </label>
          </div>

          <button type="button" className="secondary-button" onClick={addCustomExercise}>
            {text.customAdd}
          </button>

          {customPlan.length > 0 ? (
            <div className="custom-plan-list" aria-label="Custom exercises">
              {customPlan.map((exercise) => (
                <div key={`custom-${exercise.name}`} className="custom-plan-item">
                  <span>{getExerciseDisplayName(exercise.name)}</span>
                  <button type="button" className="remove-set-button" onClick={() => removeCustomExercise(exercise.name)}>
                    {text.customRemove}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">{text.customEmpty}</p>
          )}
        </section>
      )}

      <section className="day-plan-card">
        <div className="day-plan-header" aria-hidden="true" style={{ display: 'none' }}>
          <h2>{activeDay.title}</h2>
        </div>

        <div className="day-exercises">
          {activeExercises.map((exercise) => {
            const draft = getDraftForExercise(exercise.name, exercise)
            const setCount = getDefaultSetCount(exercise)
            const setWeights = draft.setWeights.length ? draft.setWeights : Array.from({ length: setCount }, () => Number(draft.weight) || 0)
            const exerciseKey = normalizeExerciseName(exercise.name)
            const displayName = getExerciseDisplayName(exercise.name)
            const displayTitle = splitExerciseTitle(displayName)
            const libraryMatch = exerciseCatalog.find((item) => normalizeExerciseName(item.name) === exerciseKey)
            const exerciseHistory = history
              .filter((entry) => {
                const match = exerciseCatalog.find((item) => item.id === entry.exerciseId)
                return match && normalizeExerciseName(match.name) === exerciseKey
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            const progressItems = exerciseHistory.slice(0, 5).map((entry) => ({
              id: entry.id,
              date: entry.date,
              maxWeight: Math.max(...entry.sets.map((set) => set.weight), 0),
              totalVolume: entry.sets.reduce((total, set) => total + set.reps * set.weight, 0),
              setsCount: entry.sets.length,
              comments: sanitizeLoggedComment(entry.notes, [
                exercise.goal,
                exercise.tip,
                libraryMatch?.overallStatement,
                libraryMatch?.notes,
                ...(libraryMatch?.tips?.map((tip) => (typeof tip === 'string' ? tip : tip.text)) ?? []),
              ]),
            }))
            const muscleChips = [
              exercise.focus,
              libraryMatch?.secondaryMuscle,
            ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index).slice(0, 2)
            const activeSetIndex = activeSetIndexByExercise[exerciseKey] ?? 0
            const safeSetIndex = Math.min(Math.max(activeSetIndex, 0), Math.max(setCount - 1, 0))
            const isCollapsed = !!collapsedExercises[exerciseKey]
            const isSetSectionVisible = setSectionsVisible[exerciseKey] ?? false
            const isProgressSectionVisible = progressSectionsVisible[exerciseKey] ?? false
            const isTipsVisible = postureTipsVisible[exerciseKey] ?? true
            const postureTips = getPostureTips(exercise)

            return (
              <article
                key={`${planMode}-${activeDay.id}-${exercise.name}`}
                className={isCollapsed ? 'planned-exercise-card collapsed' : 'planned-exercise-card'}
              >
                <div className="planned-exercise-header">
                  <div className="planned-exercise-title-block">
                    <div className="planned-exercise-name-wrap">
                      <strong className="planned-exercise-main-name">{displayTitle.main}</strong>
                      {displayTitle.details ? <span className="planned-exercise-detail-name">{displayTitle.details}</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="toggle-button collapse-trigger"
                    onClick={() => toggleExerciseCollapse(exercise.name)}
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? `Expand ${exercise.name}` : `Collapse ${exercise.name}`}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                </div>

                {!isCollapsed && (
                  <>
                    <div className="chip-row chip-row-tight">
                      {muscleChips.map((muscle, index) => (
                        <span key={`${exerciseKey}-muscle-${index}`} className={index === 0 ? 'chip' : 'chip subtle'}>
                          {muscle}
                        </span>
                      ))}
                    </div>

                    <div className="posture-tips-box">
                      <div
                        className="posture-tips-header"
                        role="button"
                        tabIndex={0}
                        onClick={() => togglePostureTips(exercise.name)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            togglePostureTips(exercise.name)
                          }
                        }}
                        aria-label={isTipsVisible ? `Hide posture tips for ${exercise.name}` : `Show posture tips for ${exercise.name}`}
                      >
                        <span>{text.posture}</span>
                        <button
                          type="button"
                          className="toggle-button"
                          onClick={(event) => {
                            event.stopPropagation()
                            togglePostureTips(exercise.name)
                          }}
                          aria-label={isTipsVisible ? `Hide posture tips for ${exercise.name}` : `Show posture tips for ${exercise.name}`}
                        >
                          {isTipsVisible ? '−' : '+'}
                        </button>
                      </div>

                      {isTipsVisible && (
                        <ul className="posture-tips-list">
                          {postureTips.map((tip, index) => (
                            <li key={`${exercise.name}-tip-${index}`}>{tip}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="plan-metrics">
                      <div className="metric-pill">
                        <span>{text.sets}</span>
                        <strong>{exercise.sets ?? '—'}</strong>
                      </div>
                      <div className="metric-pill">
                        <span>{text.reps}</span>
                        <strong>{exercise.reps ?? '—'}</strong>
                      </div>
                      <div className="metric-pill">
                        <span>{text.rest}</span>
                        <strong>{exercise.rest}</strong>
                      </div>
                    </div>

                    <div className="planned-progress-box">
                      <div className="planned-set-header">
                        <span>{text.setLog}</span>
                        <button
                          type="button"
                          className="toggle-button set-section-toggle"
                          onClick={() => toggleSetSection(exercise.name)}
                          aria-label={isSetSectionVisible ? `Hide sets for ${exercise.name}` : `Show sets for ${exercise.name}`}
                        >
                          {isSetSectionVisible ? '−' : '+'}
                        </button>
                      </div>

                      {isSetSectionVisible && (
                        <div className="planned-set-grid">
                          {Array.from({ length: setCount }, (_, index) => {
                            const isOpen = index === safeSetIndex

                            return (
                              <div
                                key={`${exercise.name}-set-${index + 1}`}
                                className={isOpen ? 'planned-set-row' : 'planned-set-row collapsed'}
                                onClick={() => !isOpen && setActiveSetIndexByExercise((current) => ({ ...current, [exerciseKey]: index }))}
                              >
                                <span className="planned-set-label">Set {index + 1}</span>
                                {isOpen ? (
                                  <div className="planned-set-field-pair">
                                    <label>
                                      <span>Reps</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={draft.reps}
                                        aria-label={`Set ${index + 1} reps`}
                                        onChange={(event) => updatePlanSetValue(exercise.name, index, 'reps', event.target.value, setCount)}
                                      />
                                    </label>
                                    <label>
                                      <span>Weight</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={setWeights[index] ?? 0}
                                        aria-label={`Set ${index + 1} weight`}
                                        onFocus={(event) => event.currentTarget.select()}
                                        onClick={(event) => event.currentTarget.select()}
                                        onChange={(event) => updatePlanSetValue(exercise.name, index, 'weight', event.target.value, setCount)}
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  <div className="planned-progress-meta">
                                    <small>{text.ready}</small>
                                    <strong>{setWeights[index] ?? 0} kg</strong>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {isSetSectionVisible && (
                        <label className="planned-notes-field">
                          <span>Notes</span>
                          <textarea
                            rows={2}
                            value={draft.notes}
                            placeholder="Add notes for this exercise"
                            onChange={(event) => updatePlanDraft(exercise.name, 'notes', event.target.value)}
                          />
                        </label>
                      )}

                      {isSetSectionVisible && (
                        <button type="button" className="primary-button small-button" onClick={() => logPlannedExercise(exercise)}>
                          {text.log}
                        </button>
                      )}

                    </div>

                    <div className="planned-progress-box">
                      <div className="planned-history-section">
                        <div className="planned-set-header">
                          <span>{text.progress}</span>
                          <button
                            type="button"
                            className="toggle-button set-section-toggle"
                            onClick={() => toggleProgressSection(exercise.name)}
                            aria-label={isProgressSectionVisible ? `Hide progress for ${exercise.name}` : `Show progress for ${exercise.name}`}
                          >
                            {isProgressSectionVisible ? '−' : '+'}
                          </button>
                        </div>

                        {isProgressSectionVisible && progressItems.length > 0 ? (
                          <div className="planned-history-list">
                            {progressItems.map((item) => (
                              <article key={item.id} className="planned-history-item">
                                <div className="planned-history-topline">
                                  <span>{formatHistoryDate(item.date)}</span>
                                  <strong>{item.maxWeight} kg</strong>
                                </div>

                                <div className="planned-history-meta">
                                  <small>{item.totalVolume} kg volume</small>
                                  <small>{item.setsCount} sets</small>
                                </div>

                                {item.comments ? (
                                  <p className="planned-history-comment">
                                    <strong>{text.comments}:</strong> {item.comments}
                                  </p>
                                ) : null}
                              </article>
                            ))}
                          </div>
                        ) : isProgressSectionVisible ? (
                          <p className="empty-state">{text.noProgressHistory}</p>
                        ) : null}
                      </div>

                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
