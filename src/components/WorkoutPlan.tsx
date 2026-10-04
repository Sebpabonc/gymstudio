import React, { useEffect, useMemo, useRef, useState } from 'react'
import AskExercise from './AskExercise'
import { localIsoDate } from '../lib/dates'
import { Exercise, PlannedExercise as BlockExercise, TrainingBlock, WorkoutEntry, WorkoutSet } from '../types'
import {
  fetchTrainingBlocks,
  getActiveBlockId,
  getExerciseDisplayName,
  getSessionStorageValue,
  loadExercises,
  loadWeightTargets,
  consumeWeightTarget,
  loadWorkoutHistory,
  normalizeExerciseName,
  saveWorkoutHistory,
  setSessionStorageValue,
  storageKey,
  setActiveBlockId,
  upsertExerciseRecord,
} from '../utils/storage'
import { applyTargetToWeights, targetAppliesToDay } from '../utils/weightTargets'
import {
  blockDateRange,
  blockWeek,
  defaultActiveBlock,
  formatBenchAngle,
  nextUnloggedDay,
  trainingBlockDateStatus,
} from '../utils/trainingBlocks'
import { findCompletedEntry, findNextPendingIndex, findPrefillEntry, formatLoggedTime, summarizeCompletedEntry, upsertScopedEntry } from '../utils/completedExercises'
import {
  copySetOneWeight,
  copyWeightToUntouchedSets,
  filterLoggableSets,
  getPreviousWorkoutSets,
  parseRepPrescription,
  selectCompletedSets,
  stepWorkoutValue,
  workoutMaxWeight,
  workoutVolume,
} from '../utils/workoutSets'
import { createSupersetEntries, groupSupersets } from '../utils/supersets'
import {
  captureUndoSnapshots,
  createSessionSummary,
  getPersonalRecordBadges,
  SessionStart,
  sessionDurationMs,
  SessionSummary,
  undoLoggedEntries,
  UndoSnapshot,
} from '../utils/loggingFeedback'

type PlanExercise = {
  name: string
  sets?: string
  reps?: string
  repsPerSet?: string[]
  rest: string
  restSeconds?: number
  focus: string
  goal: string
  tip: string
  exerciseId?: string
  code?: string
  technique?: BlockExercise['technique']
  angleDegrees?: number
  notes?: string
}

type PlanDraft = {
  reps: number
  weight: number
  setWeights: number[]
  setWeightTouched: boolean[]
  setReps: number[]
  dropSetWeights: number[]
  dropSetReps: number[]
  setDone: boolean[]
  notes: string
}

type PlanMode = 'preset' | 'custom'

type LogToast = {
  message: string
  undoSnapshots: UndoSnapshot[]
}

type DaySessionSummary = SessionSummary & {
  nextSession?: string
}

function SteppedNumberInput({
  value,
  step,
  min,
  label,
  onChange,
  onFocus,
  onClick,
  invalid = false,
  dataLogWeight = false,
}: {
  value: number
  step: number
  min: number
  label: string
  onChange: (value: string) => void
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onClick?: React.MouseEventHandler<HTMLInputElement>
  invalid?: boolean
  dataLogWeight?: boolean
}) {
  return (
    <div className="set-stepper">
      <button
        type="button"
        className="stepper-button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(String(stepWorkoutValue(value, -1, step, min)))}
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        aria-label={label}
        aria-invalid={invalid}
        data-log-weight={dataLogWeight ? true : undefined}
        onFocus={onFocus}
        onClick={onClick}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="stepper-button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(String(stepWorkoutValue(value, 1, step, min)))}
      >
        +
      </button>
    </div>
  )
}

const CUSTOM_PLAN_KEY = 'gym-studio.custom-plan'
const BLOCK_CARD_EXPANDED_KEY = 'gym-studio.block-card-expanded'

const defaultCustomExercise: PlanExercise = {
  name: '',
  sets: '3',
  reps: '8-10',
  rest: "1'30\"",
  focus: 'General',
  goal: '',
  tip: '',
}

function loadCustomPlan(): PlanExercise[] {
  const raw = localStorage.getItem(storageKey(CUSTOM_PLAN_KEY))
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

function saveCustomPlan(exercises: PlanExercise[]) {
  localStorage.setItem(storageKey(CUSTOM_PLAN_KEY), JSON.stringify(exercises))
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

const techniqueLabels: Record<NonNullable<PlanExercise['technique']>, string> = {
  straight: 'Straight sets',
  superset: 'Superset',
  'drop-set': 'Drop set',
  pyramid: 'Pyramid',
  'reverse-pyramid': 'Reverse pyramid',
}

function formatBlockStartDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(date)
  return `${weekday} ${date.getUTCDate()} ${month}`
}

function getBlockExerciseName(exercise: BlockExercise, exercises: Exercise[]) {
  return exercises.find((item) => item.id === exercise.exerciseId)?.name ?? exercise.exerciseId
}

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
  return localIsoDate()
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
  onSignIn,
  onStartRest,
}: {
  mode?: PlanMode
  lockMode?: boolean
  onSignIn: () => void
  onStartRest: (durationSeconds: number) => void
}) {
  const [planMode, setPlanMode] = useState<PlanMode>(mode ?? 'preset')
  const [selectedDay, setSelectedDay] = useState('chest-back-a')
  const [customPlan, setCustomPlan] = useState<PlanExercise[]>(() => loadCustomPlan())
  const [customExerciseDraft, setCustomExerciseDraft] = useState<PlanExercise>(defaultCustomExercise)
  const [selectedLibraryExerciseId, setSelectedLibraryExerciseId] = useState('')
  const [logError, setLogError] = useState<Record<string, string>>({})
  const [weightTargets, setWeightTargets] = useState(() => loadWeightTargets())
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([])
  const [trainingBlocks, setTrainingBlocks] = useState<TrainingBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState(() => getActiveBlockId() ?? '')
  const [pinnedBlockId, setPinnedBlockId] = useState(() => getActiveBlockId() ?? '')
  const [blockCardExpanded, setBlockCardExpanded] = useState(
    () => getSessionStorageValue(BLOCK_CARD_EXPANDED_KEY) === 'true'
  )
  const [blockSelectorOpen, setBlockSelectorOpen] = useState(false)
  const [blockInsightsOpen, setBlockInsightsOpen] = useState(false)
  const [history, setHistory] = useState<WorkoutEntry[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getTodayIsoDate)
  const [plannedDrafts, setPlannedDrafts] = useState<Record<string, PlanDraft>>({})
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({})
  const [completedSupersetSets, setCompletedSupersetSets] = useState<Record<string, boolean[]>>({})
  const [progressSectionsVisible, setProgressSectionsVisible] = useState<Record<string, boolean>>({})
  const [postureTipsVisible, setPostureTipsVisible] = useState<Record<string, boolean>>({})
  const [squeezeCueExpanded, setSqueezeCueExpanded] = useState<Record<string, boolean>>({})
  const [loggedAtByExercise, setLoggedAtByExercise] = useState<Record<string, number>>({})
  const [toast, setToast] = useState<LogToast | null>(null)
  const [sessionSummary, setSessionSummary] = useState<DaySessionSummary | null>(null)
  const sessionStartedAt = useRef<SessionStart | null>(null)

  const text = {
    badge: '6-week block',
    sets: 'Sets',
    reps: 'Reps',
    rest: 'Rest',
    setLog: 'Set log',
    progress: 'Progress',
    comments: 'Comments',
    noProgressHistory: 'No historical progress logged yet.',
    ready: 'Ready',
    posture: 'POSTURE TIPS',
    noData: 'No logged data yet',
    modePreset: '6-week block',
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
    changeBlock: 'Change block',
    coach: 'Coach',
    pt: 'PT',
    loadingBlocks: 'Loading training blocks…',
  }

  const today = getTodayIsoDate()
  const activeBlock = useMemo(
    () =>
      trainingBlocks.find((block) => block.id === selectedBlockId) ??
      defaultActiveBlock(trainingBlocks, today),
    [selectedBlockId, today, trainingBlocks]
  )
  const activeDay = activeBlock?.days.find((day) => day.key === selectedDay) ?? activeBlock?.days[0]
  const activeBlockExercises = useMemo(
    () =>
      activeDay?.exercises.map((exercise) => ({
        name: getBlockExerciseName(exercise, exerciseCatalog),
        sets: String(exercise.sets),
        reps: exercise.reps.join(' · '),
        repsPerSet: exercise.reps,
        rest: `${exercise.restSeconds} s`,
        restSeconds: exercise.restSeconds,
        focus: activeDay.focus ?? '',
        goal: '',
        tip: '',
        exerciseId: exercise.exerciseId,
        code: exercise.code,
        technique: exercise.technique,
        angleDegrees: exercise.angleDegrees,
        notes: exercise.notes,
      })) ?? [],
    [activeDay, exerciseCatalog]
  )
  const activeExercises = planMode === 'preset' ? activeBlockExercises : customPlan
  const activeBlockWeek = activeBlock ? blockWeek(activeBlock, today) : null
  const todayDay = activeBlock ? nextUnloggedDay(activeBlock, history, today) : undefined
  const personalRecordBadgesByEntryId = useMemo(
    () => new Map(
      history
        .filter((entry) => entry.date === today)
        .map((entry) => [entry.id, getPersonalRecordBadges(entry, history, trainingBlocks)])
    ),
    [history, today, trainingBlocks]
  )

  const completionScope = (blockId?: string, dayKey?: string) => ({ date: localIsoDate(), blockId, dayKey })
  const activeCompletionScope =
    planMode === 'preset' && activeBlock && activeDay
      ? completionScope(activeBlock.id, activeDay.key)
      : completionScope()
  const findExerciseCompletion = (exercise: PlanExercise, entries: WorkoutEntry[]) => {
    const exerciseKey = normalizeExerciseName(exercise.name)
    const matching = entries.filter((entry) => {
      if (exercise.exerciseId) return entry.exerciseId === exercise.exerciseId
      const match = exerciseCatalog.find((item) => item.id === entry.exerciseId)
      return match && normalizeExerciseName(match.name) === exerciseKey
    })
    return findCompletedEntry(matching, activeCompletionScope)
  }

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (mode) {
      setPlanMode(mode)
    }
  }, [mode])

  useEffect(() => {
    if (planMode !== 'preset') sessionStartedAt.current = null
  }, [planMode])

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadExercises(), loadWorkoutHistory(), fetchTrainingBlocks()]).then(([exercises, entries, blocks]) => {
      if (cancelled) return
      setExerciseCatalog(exercises)
      setHistory(entries)
      setTrainingBlocks(blocks)
      const savedBlockId = getActiveBlockId()
      const pinnedBlock = blocks.find((block) => block.id === savedBlockId)
      const nextBlock = pinnedBlock ?? defaultActiveBlock(blocks, getTodayIsoDate())
      if (savedBlockId && !pinnedBlock) setActiveBlockId(null)
      setPinnedBlockId(pinnedBlock?.id ?? '')
      setSelectedBlockId(nextBlock?.id ?? '')
      setSelectedDay(nextBlock ? nextUnloggedDay(nextBlock, entries)?.key ?? '' : '')
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (planMode !== 'preset') return
    setCollapsedExercises((current) => ({
      ...Object.fromEntries(
        activeBlockExercises.map((exercise) => [normalizeExerciseName(exercise.name), true] as const)
      ),
      ...current,
    }))
  }, [activeBlock?.id, activeDay?.key, activeBlockExercises, planMode])

  const calendarHistoryItems = useMemo(
    () =>
      history
        .filter((entry) => entry.date === selectedCalendarDate)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((entry) => {
          const exercise = exerciseCatalog.find((item) => item.id === entry.exerciseId)
          const maxWeight = workoutMaxWeight(entry.sets)
          const totalVolume = workoutVolume(entry.sets)

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
      const currentBestWeight = current ? workoutMaxWeight(current.sets) : 0
      const nextBestWeight = workoutMaxWeight(entry.sets)

      if (!current || nextBestWeight > currentBestWeight) {
        map.set(key, entry)
      }
    }

    return map
  }, [exerciseCatalog, history])

  const getPlanDraftKey = (exerciseName: string) =>
    `${planMode === 'preset' ? `${activeBlock?.id ?? ''}:${activeDay?.key ?? ''}` : 'custom'}:${normalizeExerciseName(exerciseName)}`

  const updatePlanDraft = (exercise: PlanExercise, field: 'reps' | 'weight' | 'notes', value: string) => {
    const key = getPlanDraftKey(exercise.name)

    setPlannedDrafts((current) => {
      const currentDraft = current[key] ?? getDraftForExercise(exercise.name, exercise)

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

  const updatePlanSetValue = (
    exercise: PlanExercise,
    setIndex: number,
    field: 'reps' | 'weight' | 'dropReps' | 'dropWeight',
    value: string,
    setCount: number
  ) => {
    const key = getPlanDraftKey(exercise.name)

    setPlannedDrafts((current) => {
      const currentDraft = current[key] ?? getDraftForExercise(exercise.name, exercise)

      let nextSetWeights = Array.from(
        { length: setCount },
        (_, index) => currentDraft.setWeights[index] ?? currentDraft.weight
      )
      const nextSetWeightTouched = Array.from(
        { length: setCount },
        (_, index) => currentDraft.setWeightTouched[index] ?? (nextSetWeights[index] !== 0)
      )
      const nextSetReps = Array.from(
        { length: setCount },
        (_, index) => currentDraft.setReps[index] ?? currentDraft.reps
      )
      const nextDropSetWeights = Array.from(
        { length: setCount },
        (_, index) => currentDraft.dropSetWeights[index] ?? (currentDraft.setWeights[index] ?? currentDraft.weight) * 0.75
      )
      const nextDropSetReps = Array.from(
        { length: setCount },
        (_, index) => currentDraft.dropSetReps[index] ?? currentDraft.setReps[index] ?? currentDraft.reps
      )
      const nextReps = Number(value) || 0

      if (field === 'weight' || field === 'dropWeight') {
        const weights = field === 'weight' ? nextSetWeights : nextDropSetWeights
        weights[setIndex] = Number(value) || 0
        if (field === 'weight') {
          nextSetWeightTouched[setIndex] = true
          nextSetWeights = copyWeightToUntouchedSets(
            nextSetWeights,
            nextSetWeightTouched,
            setIndex,
            Number(value) || 0
          )
        }
      } else {
        const reps = field === 'reps' ? nextSetReps : nextDropSetReps
        reps[setIndex] = nextReps
      }

      return {
        ...current,
        [key]: {
          ...currentDraft,
          reps: field === 'reps' ? nextReps : currentDraft.reps,
          weight: field === 'weight' ? nextSetWeights[0] ?? 0 : currentDraft.weight,
          setWeights: field === 'weight' ? nextSetWeights : currentDraft.setWeights,
          setWeightTouched: field === 'weight' ? nextSetWeightTouched : currentDraft.setWeightTouched,
          setReps: field === 'reps' ? nextSetReps : currentDraft.setReps,
          dropSetWeights: field === 'dropWeight' ? nextDropSetWeights : currentDraft.dropSetWeights,
          dropSetReps: field === 'dropReps' ? nextDropSetReps : currentDraft.dropSetReps,
        },
      }
    })
  }

  const getDefaultRepTarget = (exercise: PlanExercise) => {
    const raw = exercise.reps ?? '8'
    return parseRepPrescription(raw)[0] ?? 8
  }

  const getDefaultDropRepTarget = (exercise: PlanExercise, index: number) => {
    const raw = exercise.repsPerSet?.[index] ?? exercise.reps ?? '8'
    const reps = parseRepPrescription(raw)
    return reps[1] ?? reps[0] ?? 8
  }

  const getDefaultSetCount = (exercise: PlanExercise) => {
    const raw = exercise.sets ?? '1'
    const match = raw.match(/(\d+)/)
    return match ? Number(match[1]) : 1
  }

  const getAppliedTarget = (exercise?: PlanExercise, exerciseId?: string) => {
    if (!exercise || !exerciseId) return undefined
    const target = weightTargets[exerciseId]
    return targetAppliesToDay(target, planMode === 'preset' ? activeDay?.key : undefined) ? target : undefined
  }

  const getDraftForExercise = (exerciseName: string, exercise?: PlanExercise) => {
    const key = getPlanDraftKey(exerciseName)
    const best = bestProgressByName.get(normalizeExerciseName(exerciseName))
    const bestWeight = best ? workoutMaxWeight(best.sets) : 0
    const bestReps = best && best.sets.length ? Math.max(...best.sets.map((set) => set.reps), 0) : 8
    const fallbackReps = exercise ? getDefaultRepTarget(exercise) : bestReps
    const fallbackSetCount = exercise ? getDefaultSetCount(exercise) : 1
    const prefillExerciseId =
      exercise?.exerciseId ??
      exerciseCatalog.find((item) => normalizeExerciseName(item.name) === normalizeExerciseName(exerciseName))?.id
    const prefill =
      exercise && prefillExerciseId
        ? findPrefillEntry(history, prefillExerciseId, planMode === 'preset' ? activeDay?.key : undefined)
        : undefined
    const lastWeights = Array.from({ length: fallbackSetCount }, (_, index) => {
      const source = prefill ? prefill.sets[index] ?? prefill.sets[prefill.sets.length - 1] : undefined
      return Number(source?.weight ?? bestWeight) || 0
    })
    const appliedTarget = getAppliedTarget(exercise, prefillExerciseId)
    const baseSetWeights = appliedTarget ? applyTargetToWeights(lastWeights, appliedTarget) : lastWeights
    const baseDropWeights = Array.from({ length: fallbackSetCount }, (_, index) => {
      const source = prefill ? prefill.sets[index] ?? prefill.sets[prefill.sets.length - 1] : undefined
      return Number(source?.drop?.weight) || Number(((baseSetWeights[index] ?? 0) * 0.75).toFixed(2))
    })
    const baseSetReps = Array.from({ length: fallbackSetCount }, (_, index) => {
      const prescribed = exercise?.repsPerSet?.[index] ?? exercise?.reps ?? ''
      return parseRepPrescription(prescribed)[0] || Number(fallbackReps) || 8
    })
    const baseDropSetReps = Array.from({ length: fallbackSetCount }, (_, index) =>
      exercise ? getDefaultDropRepTarget(exercise, index) : baseSetReps[index]
    )

    return (
      plannedDrafts[key] ?? {
        reps: baseSetReps[0] ?? (Number(fallbackReps) || 8),
        weight: baseSetWeights[0] ?? 0,
        setWeights: baseSetWeights,
        setWeightTouched: baseSetWeights.map((weight) => weight !== 0),
        setReps: baseSetReps,
        dropSetWeights: baseDropWeights,
        dropSetReps: baseDropSetReps,
        setDone: Array.from({ length: fallbackSetCount }, () => false),
        notes: '',
      }
    )
  }

  const copyPlanSetOneWeight = (exercise: PlanExercise, setCount: number) => {
    const key = getPlanDraftKey(exercise.name)
    const currentDraft = getDraftForExercise(exercise.name, exercise)
    const weights = Array.from(
      { length: setCount },
      (_, index) => currentDraft.setWeights[index] ?? currentDraft.weight
    )
    if (!(weights[0] > 0)) return

    const nextWeights = copySetOneWeight(weights)
    setPlannedDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? currentDraft),
        weight: nextWeights[0],
        setWeights: nextWeights,
        setWeightTouched: nextWeights.map((_, index) => index === 0),
      },
    }))
  }

  const togglePlanSetDone = (exercise: PlanExercise, setIndex: number, setCount: number) => {
    const key = getPlanDraftKey(exercise.name)
    const currentDraft = getDraftForExercise(exercise.name, exercise)
    const nextCompleted = Array.from(
      { length: setCount },
      (_, index) => currentDraft.setDone[index] ?? false
    )
    nextCompleted[setIndex] = !nextCompleted[setIndex]
    setPlannedDrafts((current) => ({
      ...current,
      [key]: { ...(current[key] ?? currentDraft), setDone: nextCompleted },
    }))
    if (nextCompleted.every(Boolean)) void logPlannedExercise(exercise, nextCompleted)
  }

  const toggleExerciseCollapse = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)

    setCollapsedExercises((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const getPostureTips = (exercise: PlanExercise, libraryMatch?: Exercise) => {
    if (exercise.exerciseId && libraryMatch?.postureTips?.length) return libraryMatch.postureTips
    return [exercise.goal, exercise.tip].filter(Boolean).map((tip) => tip.trim())
  }

  const toggleProgressSection = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)

    setProgressSectionsVisible((current) => ({
      ...current,
      [key]: !(current[key] ?? false),
    }))
  }

  const togglePostureTips = (exerciseName: string) => {
    const key = normalizeExerciseName(exerciseName)

    setPostureTipsVisible((current) => ({
      ...current,
      [key]: !(current[key] ?? false),
    }))
  }

  const toggleBlockCard = () => {
    setBlockCardExpanded((current) => {
      const next = !current
      setSessionStorageValue(BLOCK_CARD_EXPANDED_KEY, String(next))
      return next
    })
  }

  const useDateBasedBlock = () => {
    const block = defaultActiveBlock(trainingBlocks, today)
    setActiveBlockId(null)
    setPinnedBlockId('')
    setSelectedBlockId(block?.id ?? '')
    setSelectedDay(block ? nextUnloggedDay(block, history, today)?.key ?? '' : '')
    setCollapsedExercises({})
    setPlannedDrafts({})
    setBlockSelectorOpen(false)
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
    const nextCollapsedState = activeExercises.map((exercise) => [normalizeExerciseName(exercise.name), true] as const)

    setCollapsedExercises(Object.fromEntries(nextCollapsedState))
    setProgressSectionsVisible(Object.fromEntries(
      activeExercises.map((exercise) => [normalizeExerciseName(exercise.name), false] as const)
    ))
  }

  const showLogToast = (
    entries: WorkoutEntry[],
    previousHistory: WorkoutEntry[],
    nextHistory: WorkoutEntry[],
    scope: typeof activeCompletionScope
  ) => {
    const exerciseNames = entries.map(
      (entry) => exerciseCatalog.find((exercise) => exercise.id === entry.exerciseId)?.name ?? entry.exerciseId
    )
    const setCount = entries.reduce((total, entry) => total + entry.sets.length, 0)
    const recordMessages = entries.flatMap((entry) =>
      getPersonalRecordBadges(entry, nextHistory, trainingBlocks).map((badge) => {
        if (badge === 'weight') return `New weight PR ${workoutMaxWeight(entry.sets)} kg`
        if (badge === 'reps') return 'New rep PR'
        return 'New e1RM PR'
      })
    )

    setToast({
      message: `${exerciseNames.join(' + ')} logged · ${setCount} ${setCount === 1 ? 'set' : 'sets'}${
        recordMessages.length ? ` · ${recordMessages.join(' · ')} 🎉` : ''
      }`,
      undoSnapshots: captureUndoSnapshots(previousHistory, entries, scope),
    })
  }

  const getSessionScopeKey = (scope: typeof activeCompletionScope, currentMode: PlanMode) =>
    `${currentMode}:${scope.date}:${scope.blockId ?? ''}:${scope.dayKey ?? ''}`

  const startSession = (loggedAt: number, scope: typeof activeCompletionScope) => {
    if (planMode !== 'preset') return
    const scopeKey = getSessionScopeKey(scope, planMode)
    if (sessionStartedAt.current?.scopeKey !== scopeKey) {
      sessionStartedAt.current = { scopeKey, timestamp: loggedAt }
    }
  }

  const maybeShowSessionSummary = (
    previousHistory: WorkoutEntry[],
    nextHistory: WorkoutEntry[],
    loggedAt: number
  ) => {
    if (planMode !== 'preset' || !activeBlock || !activeDay || activeExercises.length === 0) return
    const wasComplete = activeExercises.every((exercise) => findExerciseCompletion(exercise, previousHistory))
    const isComplete = activeExercises.every((exercise) => findExerciseCompletion(exercise, nextHistory))
    if (!isComplete || wasComplete) return

    const entries = nextHistory.filter(
      (entry) =>
        entry.date === activeCompletionScope.date &&
        entry.blockId === activeCompletionScope.blockId &&
        entry.dayKey === activeCompletionScope.dayKey
    )
    const nextDay = nextUnloggedDay(activeBlock, nextHistory, today)
    const scopeKey = getSessionScopeKey(activeCompletionScope, planMode)
    setSessionSummary({
      ...createSessionSummary(
        entries,
        sessionDurationMs(sessionStartedAt.current, scopeKey, loggedAt),
        nextHistory,
        trainingBlocks
      ),
      nextSession: nextDay ? `Day ${nextDay.position} · ${nextDay.name}` : undefined,
    })
  }

  const undoLastLog = () => {
    if (!toast) return
    const nextHistory = undoLoggedEntries(history, toast.undoSnapshots)
    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    setToast(null)
    setSessionSummary(null)
  }

  const logPlannedExercise = async (exercise: PlanExercise, completedRows?: boolean[]) => {
    const exerciseKey = getPlanDraftKey(exercise.name)
    const sectionKey = normalizeExerciseName(exercise.name)
    const canonicalId =
      exercise.exerciseId ??
      (await upsertExerciseRecord({
        name: exercise.name,
        primaryMuscle: exercise.focus,
        notes: exercise.goal,
        tips: [exercise.tip],
      })).id

    const draft = getDraftForExercise(exercise.name, exercise)
    const setCount = getDefaultSetCount(exercise) || 1
    const allSets = Array.from({ length: setCount }, (_, index) => {
      const currentWeight = draft.setWeights?.[index] ?? draft.weight ?? 0
      const currentReps = draft.setReps?.[index] ?? draft.reps ?? getDefaultRepTarget(exercise)
      const set = createSet(Number(currentReps) || getDefaultRepTarget(exercise), Number(currentWeight) || 0)
      if (exercise.technique === 'drop-set') {
        set.drop = {
          reps: Number(draft.dropSetReps?.[index]) || getDefaultDropRepTarget(exercise, index),
          weight: Number(draft.dropSetWeights?.[index]) || 0,
        }
      }
      return set
    })
    const equipment = exerciseCatalog.find((item) => item.id === canonicalId)?.equipment
    const validSets = filterLoggableSets(
      selectCompletedSets(allSets, completedRows ?? draft.setDone),
      equipment
    )

    if (validSets.length === 0) {
      setLogError((current) => ({ ...current, [exerciseKey]: 'Enter at least one set' }))
      window.setTimeout(() => {
        const card = Array.from(document.querySelectorAll<HTMLElement>('[data-exercise-card]')).find(
          (element) => element.dataset.exerciseCard === sectionKey
        )
        card?.querySelector<HTMLInputElement>('[data-log-weight]')?.focus()
      }, 0)
      return
    }

    setLogError((current) => (current[exerciseKey] ? { ...current, [exerciseKey]: '' } : current))

    const nextEntry: WorkoutEntry = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      exerciseId: canonicalId,
      date: localIsoDate(),
      sets: validSets,
      ...(planMode === 'preset' && activeBlock && activeDay
        ? { blockId: activeBlock.id, dayKey: activeDay.key }
        : {}),
      notes: draft.notes?.trim() ?? '',
    }

    const storedHistory = await loadWorkoutHistory()
    const { history: nextHistory, entry: entryToSave } = upsertScopedEntry(storedHistory, nextEntry, activeCompletionScope)
    const loggedAt = Date.now()
    startSession(loggedAt, activeCompletionScope)

    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    onStartRest(exercise.restSeconds ?? 90)
    showLogToast([entryToSave], storedHistory, nextHistory, activeCompletionScope)
    maybeShowSessionSummary(storedHistory, nextHistory, loggedAt)
    setWeightTargets(consumeWeightTarget(entryToSave.exerciseId, entryToSave.sets))
    setExerciseCatalog(await loadExercises())

    setPlannedDrafts((current) => {
      const currentDraft = current[exerciseKey]

      if (!currentDraft) return current

      return {
        ...current,
        [exerciseKey]: {
          ...currentDraft,
          notes: '',
          setDone: Array.from({ length: setCount }, () => false),
        },
      }
    })

    setProgressSectionsVisible((current) => ({
      ...current,
      [sectionKey]: false,
    }))

    setLoggedAtByExercise((current) => ({ ...current, [entryToSave.id]: Date.now() }))

    const currentIndex = activeExercises.findIndex((item) => normalizeExerciseName(item.name) === sectionKey)
    const nextIndex = findNextPendingIndex(
      activeExercises.map((item) => !!findExerciseCompletion(item, nextHistory)),
      currentIndex
    )
    const nextExercise = nextIndex >= 0 ? activeExercises[nextIndex] : undefined
    setCollapsedExercises((current) => ({
      ...current,
      [sectionKey]: true,
      ...(nextExercise ? { [normalizeExerciseName(nextExercise.name)]: false } : {}),
    }))
  }

  const logSuperset = async (exercises: PlanExercise[], groupKey: string, completedRows: boolean[]) => {
    const setCount = Math.max(...exercises.map(getDefaultSetCount))
    const entryInputs = await Promise.all(exercises.map(async (exercise) => {
      const canonicalId =
        exercise.exerciseId ??
        (await upsertExerciseRecord({
          name: exercise.name,
          primaryMuscle: exercise.focus,
          notes: exercise.goal,
          tips: [exercise.tip],
        })).id
      const draft = getDraftForExercise(exercise.name, exercise)
      const allSets = Array.from({ length: setCount }, (_, index) => {
        const prescribedReps = exercise.repsPerSet?.[index] ?? exercise.reps ?? ''
        const reps = draft.setReps[index] ?? parseRepPrescription(prescribedReps)[0] ?? getDefaultRepTarget(exercise)
        const weight = draft.setWeights[index] ?? draft.weight ?? 0
        const set = createSet(Number(reps) || getDefaultRepTarget(exercise), Number(weight) || 0)
        if (exercise.technique === 'drop-set') {
          set.drop = {
            reps: Number(draft.dropSetReps[index]) || getDefaultDropRepTarget(exercise, index),
            weight: Number(draft.dropSetWeights[index]) || 0,
          }
        }
        return set
      })
      return {
        exerciseId: canonicalId,
        sets: selectCompletedSets(allSets, completedRows),
        equipment: exerciseCatalog.find((item) => item.id === canonicalId)?.equipment,
        notes: draft.notes,
      }
    }))
    const date = localIsoDate()
    const nextEntries = createSupersetEntries(entryInputs, { ...activeCompletionScope, date })

    if (nextEntries.length === 0) {
      setLogError((current) => ({
        ...current,
        ...Object.fromEntries(exercises.map((exercise) => [getPlanDraftKey(exercise.name), 'Enter at least one set'])),
      }))
      return
    }

    const storedHistory = await loadWorkoutHistory()
    let nextHistory = storedHistory
    const entriesToSave = nextEntries.map((entry) => {
      const result = upsertScopedEntry(nextHistory, entry, { ...activeCompletionScope, date })
      nextHistory = result.history
      return result.entry
    })
    const loggedAt = Date.now()
    const scope = { ...activeCompletionScope, date }
    startSession(loggedAt, scope)
    showLogToast(entriesToSave, storedHistory, nextHistory, scope)
    maybeShowSessionSummary(storedHistory, nextHistory, loggedAt)

    setLogError((current) => ({
      ...current,
      ...Object.fromEntries(exercises.map((exercise) => [getPlanDraftKey(exercise.name), ''])),
    }))
    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    for (const entry of entriesToSave) setWeightTargets(consumeWeightTarget(entry.exerciseId, entry.sets))
    if (entriesToSave.length === exercises.length) {
      onStartRest(exercises[exercises.length - 1]?.restSeconds ?? 90)
    }

    const exerciseKeys = exercises.map((exercise) => normalizeExerciseName(exercise.name))
    setPlannedDrafts((current) => Object.fromEntries(
      Object.entries(current).map(([key, draft]) =>
        exerciseKeys.some((exerciseKey) => key.endsWith(`:${exerciseKey}`))
          ? [key, { ...draft, notes: '' }]
          : [key, draft]
      )
    ))
    setCompletedSupersetSets((current) => ({ ...current, [groupKey]: [] }))
    setLoggedAtByExercise((current) => ({
      ...current,
      ...Object.fromEntries(entriesToSave.map((entry) => [entry.id, Date.now()])),
    }))

    const nextIndex = findNextPendingIndex(
      activeExercises.map((item) => !!findExerciseCompletion(item, nextHistory)),
      Math.max(...exercises.map((exercise) => activeExercises.findIndex((item) => item.name === exercise.name)))
    )
    const nextExercise = nextIndex >= 0 ? activeExercises[nextIndex] : undefined
    setCollapsedExercises((current) => ({
      ...current,
      ...Object.fromEntries(exercises.map((exercise) => [
        normalizeExerciseName(exercise.name),
        !!findExerciseCompletion(exercise, nextHistory),
      ])),
      ...(exercises.every((exercise) => findExerciseCompletion(exercise, nextHistory)) && nextExercise
        ? { [normalizeExerciseName(nextExercise.name)]: false }
        : {}),
    }))
  }

const updateCustomExerciseDraft = (field: keyof PlanExercise, value: string) => {
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

    const nextExercise: PlanExercise = {
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
    setProgressSectionsVisible((current) => ({ ...current, [key]: false }))
    setPostureTipsVisible((current) => ({ ...current, [key]: true }))
  }

  const addCustomExercise = () => {
    const trimmedName = customExerciseDraft.name.trim()
    if (!trimmedName) return

    const nextExercise: PlanExercise = {
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
    setProgressSectionsVisible((current) => ({ ...current, [key]: false }))
    setPostureTipsVisible((current) => ({ ...current, [key]: true }))
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

  }

  return (
    <div className="card plan-card">
      <div className="section-title-row">
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

      {planMode === 'preset' && activeBlock && (
        <section className="training-block-card" aria-label="Active training block">
          <button
            type="button"
            className="training-block-header"
            onClick={toggleBlockCard}
            aria-expanded={blockCardExpanded}
            aria-controls="training-block-content"
          >
            <span className="training-block-primary">
              <span className="training-block-name">{activeBlock.name}</span>
              <strong className="training-block-status">
                {trainingBlockDateStatus(activeBlock, today) === 'Current'
                  ? `Week ${activeBlockWeek} of ${activeBlock.weeks}`
                  : trainingBlockDateStatus(activeBlock, today) === 'Upcoming'
                    ? `Starts ${formatBlockStartDate(activeBlock.startDate)}`
                    : 'Completed'}
              </strong>
              <span className="toggle-button expand-toggle" aria-hidden="true">
                {blockCardExpanded ? '−' : '+'}
              </span>
            </span>
            <span className="training-block-badges">
              <span className="training-block-number">Block {activeBlock.number}</span>
              <span className="origin-badge">{activeBlock.origin === 'pt' ? text.pt : text.coach}</span>
              {pinnedBlockId === activeBlock.id && <span className="training-block-number">Pinned block</span>}
            </span>
          </button>
          <div id="training-block-content" className="training-block-content" hidden={!blockCardExpanded}>
            <div className="training-block-meta">
              <span>{blockDateRange(activeBlock)}</span>
              <span>{activeBlock.method.replace(/-/g, ' ')}</span>
            </div>
            <p>{activeBlock.summary}</p>
            <button
              type="button"
              className="about-block-toggle"
              onClick={() => setBlockInsightsOpen((current) => !current)}
              aria-expanded={blockInsightsOpen}
              aria-controls="training-block-insights"
            >
              About this block
              <span className="toggle-button expand-toggle" aria-hidden="true">
                {blockInsightsOpen ? '−' : '+'}
              </span>
            </button>
            <div id="training-block-insights" className="training-block-insights" hidden={!blockInsightsOpen}>
              {activeBlock.insights.map((insight) => (
                <section key={insight.title}>
                  <h5>{insight.title}</h5>
                  <p>{insight.body}</p>
                </section>
              ))}
            </div>
            <button
              type="button"
              className="secondary-button block-change-button"
              onClick={() => setBlockSelectorOpen((current) => !current)}
              aria-expanded={blockSelectorOpen}
            >
              {text.changeBlock}
            </button>
            {blockSelectorOpen && (
              <div className="training-block-options">
                {trainingBlocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    className={block.id === activeBlock.id ? 'training-block-option active' : 'training-block-option'}
                    onClick={() => {
                      setActiveBlockId(block.id)
                      setPinnedBlockId(block.id)
                      setSelectedBlockId(block.id)
                      setSelectedDay(nextUnloggedDay(block, history, today)?.key ?? block.days[0]?.key ?? '')
                      setCollapsedExercises({})
                      setPlannedDrafts({})
                      setBlockSelectorOpen(false)
                    }}
                  >
                    <span>
                      <strong>{`Block ${block.number} · ${block.name}`}</strong>
                      <small className="training-block-option-summary">{block.summary}</small>
                      <small>{`${blockDateRange(block)} · ${block.method.replace(/-/g, ' ')}`}</small>
                    </span>
                    <small className="training-block-option-status">
                      {`${trainingBlockDateStatus(block, today)}${pinnedBlockId === block.id ? ' · Pinned block' : ''}`}
                    </small>
                  </button>
                ))}
              </div>
            )}
            {pinnedBlockId === activeBlock.id && (
              <button type="button" className="secondary-button block-change-button" onClick={useDateBasedBlock}>
                Use date-based block
              </button>
            )}
          </div>
        </section>
      )}

      {planMode === 'preset' ? (
        <>
        <div className="day-tabs" aria-label="Workout days">
          {activeBlock?.days.map((day) => (
            <button
              key={day.key}
              type="button"
              className={day.key === (activeDay?.key ?? selectedDay) ? 'day-tab active' : 'day-tab'}
              aria-label={`Day ${day.position} · ${day.name}${todayDay?.key === day.key ? ' · Today' : ''}`}
              aria-pressed={day.key === (activeDay?.key ?? selectedDay)}
              onClick={() => {
                setSelectedDay(day.key)
                collapseAllExerciseSections()
              }}
            >
              <span className="day-tab-label">{`D${day.position}`}</span>
              {(() => {
                const date = localIsoDate()
                const done = day.exercises.filter((item) =>
                  history.some(
                    (entry) =>
                      entry.exerciseId === item.exerciseId &&
                      entry.date === date &&
                      entry.blockId === activeBlock.id &&
                      entry.dayKey === day.key
                  )
                ).length
                return (
                  <>
                    <span className="day-tab-progress">{`${done}/${day.exercises.length}`}</span>
                    {todayDay?.key === day.key && <span className="day-tab-today">Today</span>}
                  </>
                )
              })()}
            </button>
          ))}
        </div>
        {activeDay && <h2 className="selected-day-name">{`Day ${activeDay.position} · ${activeDay.name}`}</h2>}
        {activeDay?.focus && <p className="day-focus-label">{activeDay.focus}</p>}
        </>
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
        <div className="day-exercises">
          {groupSupersets(activeExercises).map((group) => {
            const cards = group.items.map(({ exercise, exerciseIndex }) => {
            const draft = getDraftForExercise(exercise.name, exercise)
            const setCount = getDefaultSetCount(exercise)
            const setWeights = draft.setWeights.length ? draft.setWeights : Array.from({ length: setCount }, () => Number(draft.weight) || 0)
            const setReps = draft.setReps.length ? draft.setReps : Array.from({ length: setCount }, () => Number(draft.reps) || 8)
            const dropSetWeights = draft.dropSetWeights.length
              ? draft.dropSetWeights
              : setWeights.map((weight) => Number((weight * 0.75).toFixed(2)))
            const dropSetReps = draft.dropSetReps.length
              ? draft.dropSetReps
              : Array.from({ length: setCount }, (_, index) => getDefaultDropRepTarget(exercise, index))
            const exerciseKey = normalizeExerciseName(exercise.name)
            const displayName = getExerciseDisplayName(exercise.name)
            const displayTitle = splitExerciseTitle(displayName)
            const libraryMatch =
              exerciseCatalog.find((item) => item.id === exercise.exerciseId) ??
              exerciseCatalog.find((item) => normalizeExerciseName(item.name) === exerciseKey)
            const exerciseHistory = history
              .filter((entry) => {
                if (exercise.exerciseId) return entry.exerciseId === exercise.exerciseId
                const match = exerciseCatalog.find((item) => item.id === entry.exerciseId)
                return match && normalizeExerciseName(match.name) === exerciseKey
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            const previousSets = getPreviousWorkoutSets(exerciseHistory)
            const progressItems = exerciseHistory.slice(0, 5).map((entry) => ({
              id: entry.id,
              date: entry.date,
              maxWeight: workoutMaxWeight(entry.sets),
              totalVolume: workoutVolume(entry.sets),
              setsCount: entry.sets.length,
              comments: sanitizeLoggedComment(entry.notes, [
                exercise.notes,
                exercise.goal,
                exercise.tip,
                libraryMatch?.overallStatement,
                libraryMatch?.notes,
                ...(libraryMatch?.tips?.map((tip) => (typeof tip === 'string' ? tip : tip.text)) ?? []),
              ]),
            }))
            const muscleChips = (
              libraryMatch?.primaryMuscles ??
              (libraryMatch?.primaryMuscle ? [libraryMatch.primaryMuscle] : [])
            ).slice(0, 2)
            const benchAngleLabel = formatBenchAngle(exercise.angleDegrees)
            const isCollapsed = !!collapsedExercises[exerciseKey]
            const isProgressSectionVisible = progressSectionsVisible[exerciseKey] ?? false
            const isTipsVisible = postureTipsVisible[exerciseKey] ?? false
            const postureTips = getPostureTips(exercise, libraryMatch)
            const completedEntry = findExerciseCompletion(exercise, history)
            const recordBadges =
              completedEntry?.date === today
                ? personalRecordBadgesByEntryId.get(completedEntry.id) ?? []
                : []
            const completedRows = Array.from(
              { length: setCount },
              (_, index) => draft.setDone[index] ?? false
            )
            const completedSetCount = completedRows.filter(Boolean).length
            const cardClasses = [
              'planned-exercise-card',
              isCollapsed ? 'collapsed' : '',
              completedEntry ? 'completed' : '',
            ].filter(Boolean).join(' ')

            return (
              <article
                key={`${planMode}-${activeDay?.key ?? 'custom'}-${exercise.code ?? exercise.name}`}
                className={cardClasses}
                data-exercise-card={exerciseKey}
              >
                <div className="planned-exercise-header">
                  <div className="planned-exercise-title-block">
                    {exercise.code && <span className="plan-exercise-code">{exercise.code}</span>}
                    <div className="planned-exercise-name-wrap">
                      <strong className="planned-exercise-main-name">{displayTitle.main}</strong>
                      {displayTitle.details ? <span className="planned-exercise-detail-name">{displayTitle.details}</span> : null}
                    </div>
                      {completedEntry && (
                        <span className="done-badge" role="status">
                          <span aria-hidden="true">✓ </span>
                          Done{loggedAtByExercise[completedEntry.id] ? ` · ${formatLoggedTime(loggedAtByExercise[completedEntry.id])}` : ''}
                          <span className="done-summary"> · {summarizeCompletedEntry(completedEntry)}</span>
                        </span>
                      )}
                      {recordBadges.map((badge) => (
                        <span key={`${completedEntry?.id}-${badge}`} className="personal-record-badge">
                          {badge === 'e1rm' ? 'e1RM' : badge === 'weight' ? 'Weight' : 'Rep'} PR
                        </span>
                      ))}
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
                      {exercise.technique && <span className="chip technique-chip">{techniqueLabels[exercise.technique]}</span>}
                      {benchAngleLabel && <span className="chip subtle">{benchAngleLabel}</span>}
                      {muscleChips.map((muscle, index) => (
                        <span key={`${exerciseKey}-muscle-${index}`} className={index === 0 ? 'chip' : 'chip subtle'}>
                          {muscle}
                        </span>
                      ))}
                    </div>
                    <p className="planned-meta-line">
                      {`${setCount} ${setCount === 1 ? 'set' : 'sets'} · ${exercise.repsPerSet?.join('·') ?? exercise.reps ?? '—'} reps · ${exercise.rest} rest`}
                    </p>

                    {libraryMatch?.squeezeCue?.trim() && (
                      <button
                        type="button"
                        className={`planned-squeeze-cue${squeezeCueExpanded[exerciseKey] ? ' expanded' : ''}`}
                        aria-expanded={!!squeezeCueExpanded[exerciseKey]}
                        onClick={() => setSqueezeCueExpanded((current) => ({
                          ...current,
                          [exerciseKey]: !current[exerciseKey],
                        }))}
                      >
                        <strong>Squeeze — </strong>{libraryMatch.squeezeCue}
                      </button>
                    )}

                    {!group.isSuperset && (
                      <div className="planned-set-section">
                        <div className="planned-set-header">
                          {getAppliedTarget(exercise, exercise.exerciseId) && (
                            <span className="weight-target-chip">
                              +{getAppliedTarget(exercise, exercise.exerciseId)?.increaseKg} kg applied
                            </span>
                          )}
                          <button
                            type="button"
                            className="same-as-set-one-button"
                            disabled={!(Number(setWeights[0]) > 0)}
                            onClick={() => copyPlanSetOneWeight(exercise, setCount)}
                          >
                            Same as set 1
                          </button>
                        </div>

                        <div className="planned-set-grid">
                          <div className="planned-set-column-headers" aria-hidden="true">
                            <span>Set</span>
                            <span>Previous</span>
                            <span>kg</span>
                            <span>Reps</span>
                            <span>✓</span>
                          </div>
                          {Array.from({ length: setCount }, (_, index) => {
                            const previousSet = previousSets[index]
                            return (
                              <div
                                key={`${exercise.name}-set-${index + 1}`}
                                className={`planned-set-row${completedRows[index] ? ' completed' : ''}`}
                              >
                                <span className="planned-set-label">{index + 1}</span>
                                {previousSet ? (
                                  <button
                                    type="button"
                                    className="previous-set-value"
                                    aria-label={`Copy previous set ${index + 1}: ${previousSet.weight} kilograms for ${previousSet.reps} reps`}
                                    onClick={() => {
                                      updatePlanSetValue(exercise, index, 'weight', String(previousSet.weight), setCount)
                                      updatePlanSetValue(exercise, index, 'reps', String(previousSet.reps), setCount)
                                    }}
                                  >
                                    {`${previousSet.weight} × ${previousSet.reps}`}
                                  </button>
                                ) : (
                                  <span className="previous-set-value">—</span>
                                )}
                                <SteppedNumberInput
                                  value={setWeights[index] ?? 0}
                                  step={2.5}
                                  min={0}
                                  label={`Set ${index + 1} weight in kilograms`}
                                  dataLogWeight
                                  invalid={!!logError[getPlanDraftKey(exercise.name)] && !(Number(setWeights[index]) > 0)}
                                  onFocus={(event) => event.currentTarget.select()}
                                  onClick={(event) => event.currentTarget.select()}
                                  onChange={(value) => updatePlanSetValue(exercise, index, 'weight', value, setCount)}
                                />
                                <input
                                  className="set-reps-input"
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  value={setReps[index] ?? draft.reps}
                                  aria-label={`Set ${index + 1} reps`}
                                  onChange={(event) => updatePlanSetValue(exercise, index, 'reps', event.target.value, setCount)}
                                />
                                <button
                                  type="button"
                                  className="complete-set-button"
                                  aria-label={`${completedRows[index] ? 'Unmark' : 'Mark'} set ${index + 1} complete`}
                                  aria-pressed={completedRows[index]}
                                  onClick={() => {
                                    if (!completedRows[index]) onStartRest(exercise.restSeconds ?? 90)
                                    togglePlanSetDone(exercise, index, setCount)
                                  }}
                                >
                                  ✓
                                </button>
                                {exercise.technique === 'drop-set' && (
                                  <div className="planned-drop-set-row">
                                    <strong>Drop</strong>
                                    <SteppedNumberInput
                                      value={dropSetWeights[index] ?? 0}
                                      step={2.5}
                                      min={0}
                                      label={`Set ${index + 1} drop weight in kilograms`}
                                      onFocus={(event) => event.currentTarget.select()}
                                      onClick={(event) => event.currentTarget.select()}
                                      onChange={(value) => updatePlanSetValue(exercise, index, 'dropWeight', value, setCount)}
                                    />
                                    <input
                                      className="set-reps-input"
                                      type="number"
                                      inputMode="numeric"
                                      min="1"
                                      value={dropSetReps[index] ?? setReps[index] ?? draft.reps}
                                      aria-label={`Set ${index + 1} drop reps`}
                                      onChange={(event) => updatePlanSetValue(exercise, index, 'dropReps', event.target.value, setCount)}
                                    />
                                    <span aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {logError[getPlanDraftKey(exercise.name)] && (
                          <p role="alert" aria-live="assertive" className="account-error log-error">{logError[getPlanDraftKey(exercise.name)]}</p>
                        )}

                        {(completedSetCount < setCount || logError[getPlanDraftKey(exercise.name)]) && (
                          <button
                            type="button"
                            className="primary-button small-button"
                            onClick={() => void logPlannedExercise(exercise, completedRows)}
                          >
                            Log exercise
                          </button>
                        )}
                      </div>
                    )}

                    <div className="exercise-detail-row">
                      <button
                        type="button"
                        className="exercise-detail-toggle"
                        onClick={() => togglePostureTips(exercise.name)}
                        aria-expanded={isTipsVisible}
                        aria-controls={`posture-tips-${exerciseKey}`}
                      >
                        {text.posture}<span aria-hidden="true">{isTipsVisible ? '−' : '+'}</span>
                      </button>
                      <ul id={`posture-tips-${exerciseKey}`} className="posture-tips-list" hidden={!isTipsVisible}>
                        {postureTips.map((tip, index) => (
                          <li key={`${exercise.name}-tip-${index}`}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                    {exercise.notes?.trim() && <p className="planned-exercise-notes">{exercise.notes}</p>}
                    <div className="exercise-detail-row">
                      <button
                        type="button"
                        className="exercise-detail-toggle"
                        onClick={() => toggleProgressSection(exercise.name)}
                        aria-expanded={isProgressSectionVisible}
                      >
                        {text.progress}<span aria-hidden="true">{isProgressSectionVisible ? '−' : '+'}</span>
                      </button>
                      {isProgressSectionVisible && (progressItems.length > 0 ? (
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
                      ) : <p className="empty-state">{text.noProgressHistory}</p>)}
                    </div>
                    {libraryMatch && (
                      <div className="exercise-detail-row">
                        <AskExercise
                          exerciseId={libraryMatch.id}
                          exerciseName={libraryMatch.name}
                          onSignIn={onSignIn}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      className="rest-start-button"
                      onClick={() => onStartRest(exercise.restSeconds ?? 90)}
                    >
                      Start rest
                    </button>
                    {exercise.notes?.trim() && <p className="planned-exercise-notes">{exercise.notes}</p>}
                    {!group.isSuperset && (
                      <label className="planned-notes-field">
                        <span>Notes</span>
                        <textarea
                          rows={2}
                          value={draft.notes}
                          placeholder="Add notes for this exercise"
                          onChange={(event) => updatePlanDraft(exercise, 'notes', event.target.value)}
                        />
                      </label>
                    )}
                  </>
                )}
              </article>
            )
            })

            if (!group.isSuperset) return <React.Fragment key={group.key}>{cards}</React.Fragment>
            const groupDone = group.items.every(({ exercise }) => findExerciseCompletion(exercise, history))
            const codes = group.items.map(({ exercise }) => exercise.code ?? exercise.name)
            const supersetExercises = group.items.map(({ exercise }) => exercise)
            const supersetSetCount = Math.max(...supersetExercises.map(getDefaultSetCount))
            const supersetCompletedRows = Array.from(
              { length: supersetSetCount },
              (_, index) => completedSupersetSets[group.key]?.[index] ?? false
            )
            const supersetCompletedCount = supersetCompletedRows.filter(Boolean).length
            const supersetError = supersetExercises
              .map((exercise) => logError[getPlanDraftKey(exercise.name)])
              .find(Boolean)
            return (
              <div key={group.key} className={groupDone ? 'superset-group completed' : 'superset-group'}>
                <div className="superset-group-header">
                  <span className="chip technique-chip">Superset</span>
                  {groupDone && <span className="done-badge" role="status"><span aria-hidden="true">✓ </span>Done</span>}
                  <p>Do {codes[0]}, rest ~10 s, then {codes.slice(1).join(', ')}; rest after the pair.</p>
                </div>
                {cards}
                <div className="planned-progress-box superset-log-box">
                  <div className="planned-set-header">
                    <span>Superset sets</span>
                  </div>
                  <div className="superset-copy-actions">
                    {supersetExercises.map((exercise) => (
                      <button
                        key={`${group.key}-${exercise.code}-copy`}
                        type="button"
                        className="same-as-set-one-button"
                        disabled={!((getDraftForExercise(exercise.name, exercise).setWeights[0] ?? 0) > 0)}
                        aria-label={`Copy ${exercise.code ?? exercise.name} set 1 weight to all sets`}
                        onClick={() => copyPlanSetOneWeight(exercise, supersetSetCount)}
                      >
                        Same as set 1 · {exercise.code ?? exercise.name}
                      </button>
                    ))}
                  </div>
                  <div
                    className="superset-set-column-headers"
                    aria-hidden="true"
                  >
                    {supersetExercises.map((exercise) => (
                      <div key={`${group.key}-${exercise.code}-column-headings`}>
                        <span>kg</span>
                        <span>Reps</span>
                      </div>
                    ))}
                  </div>
                  <div className="superset-set-grid">
                    {Array.from({ length: supersetSetCount }, (_, setIndex) => (
                      <div
                        className={`superset-set-row${supersetCompletedRows[setIndex] ? ' completed' : ''}`}
                        key={`${group.key}-set-${setIndex + 1}`}
                      >
                        <div className="planned-set-row-heading">
                          <span className="planned-set-label">Set {setIndex + 1}</span>
                          <button
                            type="button"
                            className="complete-set-button"
                            aria-label={`${supersetCompletedRows[setIndex] ? 'Unmark' : 'Mark'} superset set ${setIndex + 1} complete`}
                            aria-pressed={supersetCompletedRows[setIndex]}
                            onClick={() => {
                              const nextCompleted = [...supersetCompletedRows]
                              nextCompleted[setIndex] = !nextCompleted[setIndex]
                              setCompletedSupersetSets((current) => ({ ...current, [group.key]: nextCompleted }))
                              // Rest is taken after the pair, using the last exercise's prescribed rest.
                              if (nextCompleted[setIndex]) {
                                onStartRest(supersetExercises[supersetExercises.length - 1]?.restSeconds ?? 90)
                              }
                              if (nextCompleted.every(Boolean)) {
                                void logSuperset(supersetExercises, group.key, nextCompleted)
                              }
                            }}
                          >
                            ✓
                          </button>
                        </div>
                        <div className="superset-set-exercises">
                          {supersetExercises.map((exercise) => {
                            const draft = getDraftForExercise(exercise.name, exercise)
                            const code = exercise.code ?? exercise.name
                            const displayName = getExerciseDisplayName(exercise.name)
                            const prescribedReps =
                              exercise.repsPerSet?.[setIndex] ?? exercise.reps ?? ''
                            const reps =
                              draft.setReps[setIndex] ??
                              parseRepPrescription(prescribedReps)[0] ??
                              getDefaultRepTarget(exercise)
                            const weight = draft.setWeights[setIndex] ?? draft.weight ?? 0
                            return (
                              <div className="superset-set-exercise" key={`${group.key}-${code}`}>
                                <strong className="superset-exercise-label">{code} · {displayName}</strong>
                                <div className="planned-set-controls">
                                  <SteppedNumberInput
                                    value={weight}
                                    step={2.5}
                                    min={0}
                                    label={`Set ${setIndex + 1}, ${code} weight in kilograms`}
                                    onFocus={(event) => event.currentTarget.select()}
                                    onClick={(event) => event.currentTarget.select()}
                                    onChange={(value) =>
                                      updatePlanSetValue(exercise, setIndex, 'weight', value, supersetSetCount)
                                    }
                                  />
                                  <input
                                    className="set-reps-input"
                                    type="number"
                                    inputMode="numeric"
                                    min="1"
                                    value={reps}
                                    aria-label={`Set ${setIndex + 1}, ${code} reps`}
                                    onChange={(event) =>
                                      updatePlanSetValue(exercise, setIndex, 'reps', event.target.value, supersetSetCount)
                                    }
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="superset-notes-grid">
                    {supersetExercises.map((exercise) => {
                      const draft = getDraftForExercise(exercise.name, exercise)
                      return (
                        <label className="planned-notes-field" key={`${group.key}-${exercise.code}-notes`}>
                          <span>{exercise.code ?? exercise.name} notes</span>
                          <textarea
                            rows={2}
                            value={draft.notes}
                            placeholder={`Add notes for ${getExerciseDisplayName(exercise.name)}`}
                            onChange={(event) => updatePlanDraft(exercise, 'notes', event.target.value)}
                          />
                        </label>
                      )
                    })}
                  </div>
                  {supersetError && <p role="alert" aria-live="assertive" className="account-error log-error">{supersetError}</p>}
                  {(supersetCompletedCount < supersetSetCount || supersetError) && (
                    <button
                      type="button"
                      className="primary-button small-button"
                      onClick={() => void logSuperset(supersetExercises, group.key, supersetCompletedRows)}
                    >
                      Finish superset
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      {sessionSummary && (
        <div className="session-summary-backdrop" onClick={() => setSessionSummary(null)}>
          <section
            className="session-summary-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-summary-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="session-summary-header">
              <h2 id="session-summary-title">Session complete</h2>
              <button
                type="button"
                className="session-summary-close"
                onClick={() => setSessionSummary(null)}
                aria-label="Close session summary"
              >
                ×
              </button>
            </header>
            <div className="session-summary-metrics">
              <div><strong>{sessionSummary.duration}</strong><span>Duration</span></div>
              <div><strong>{sessionSummary.sets}</strong><span>Sets</span></div>
              <div><strong>{sessionSummary.volume.toLocaleString('en-US')} kg</strong><span>Volume</span></div>
            </div>
            <section className="session-summary-records" aria-label="Personal records">
              <h3>Personal records</h3>
              {sessionSummary.prs.length > 0 ? (
                <ul>
                  {sessionSummary.prs.map(({ exerciseId, badges }) => {
                    const exerciseName = exerciseCatalog.find((exercise) => exercise.id === exerciseId)?.name ?? exerciseId
                    const labels = badges.map((badge) =>
                      badge === 'e1rm' ? 'e1RM PR' : badge === 'weight' ? 'Weight PR' : 'Rep PR'
                    )
                    return <li key={exerciseId}>{exerciseName} · {labels.join(', ')}</li>
                  })}
                </ul>
              ) : (
                <p>No new personal records this session.</p>
              )}
            </section>
            {sessionSummary.nextSession && <p className="session-summary-next">{`Next session: ${sessionSummary.nextSession}`}</p>}
            {toast && (
              <div className="log-toast in-summary" role="status" aria-live="polite">
                <span>{toast.message}</span>
                <button type="button" onClick={undoLastLog}>Undo</button>
              </div>
            )}
          </section>
        </div>
      )}
      {toast && !sessionSummary && (
        <div className="log-toast" role="status" aria-live="polite">
          <span>{toast.message}</span>
          <button type="button" onClick={undoLastLog}>Undo</button>
        </div>
      )}
    </div>
  )
}
