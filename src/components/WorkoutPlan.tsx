import React, { useEffect, useMemo, useRef, useState } from 'react'
import { explainTrainerRecommendation } from '../ai/gateway'
import { explanationKey, explanationPayload, validateExplanation } from '../trainer/explain'
import type { AuthStatus } from '../auth/AuthProvider'
import SqueezeCue from './SqueezeCue'
import { localizeBlocks, localizeCatalogue, useSpanishContentReady } from '../i18n/content'
import { formatNumber, formatShortDate, formatWeekdayDate, localizeMuscle, useT } from '../i18n'
import type { TranslationKey } from '../i18n'
import { exerciseImageQuery, exerciseImageSearchUrl } from '../utils/exerciseImages'
import { openExternal } from '../native/openExternal'
import { localIsoDate } from '../lib/dates'
import { isDemoMode } from '../utils/demoMode'
import { Exercise, PlannedExercise as BlockExercise, TrainingBlock, WorkoutEntry, WorkoutSet } from '../types'
import type { Language, Translate } from '../i18n'
import {
  fetchTrainingBlocks,
  fetchActiveUserPlan,
  getCachedActiveUserPlan,
  getCachedTrainingBlocks,
  getActiveBlockId,
  getExerciseDisplayName,
  getSessionStorageValue,
  loadExercises,
  loadLocalExerciseSwaps,
  loadTrainerExplanation,
  saveTrainerExplanation,
  loadWorkoutHistory,
  normalizeExerciseName,
  saveLocalExerciseSwaps,
  saveWorkoutHistory,
  setSessionStorageValue,
  storageKey,
  setActiveBlockId,
  upsertExerciseRecord,
} from '../utils/storage'
import {
  blockDateRange,
  blockWeek,
  completedTrainingSessions,
  defaultActiveBlock,
  formatBenchAngle,
  formatBlockMethod,
  nextUnloggedDay,
  todayTrainingDay,
  trainingBlockDateStatus,
} from '../utils/trainingBlocks'
import { findNextPendingIndex, findWeekCompletion, weekBounds, findPrefillSelection, formatLoggedTime, getDayKeyType, summarizeCompletedEntry, upsertScopedEntry } from '../utils/completedExercises'
import {
  copySetOneWeight,
  copyWeightToUntouchedSets,
  filterLoggableSets,
  getPreviousWorkoutSets,
  getPreviousWorkoutSetRow,
  parseRepPrescription,
  selectCompletedSets,
  scaleWeightForOtherDay,
  stepWorkoutValue,
  workoutMaxWeight,
  workoutVolume,
} from '../utils/workoutSets'
import { createSupersetEntries, getLoggedSupersetRounds, groupSupersets } from '../utils/supersets'
import { recommendNextTarget, type NextTarget, type ProgressionType } from '../progress/nextTarget'
import { selectPlanBlocks } from '../plans/selectPlanBlocks'
import { loadDemoBlocks } from '../plans/demoBlock'
import { activeSwaps, applySwaps, suggestAlternatives } from '../plans/exerciseSwaps'
import type { ExerciseSwap } from '../plans/exerciseSwaps'
import { fetchExerciseSwaps, removeExerciseSwap, saveExerciseSwap } from '../utils/profileData'
import { fetchCalibrationRecommendations, saveTrainerRecommendation } from '../utils/profileData'
import type { TrainerRecommendationRow } from '../utils/profileData'
import { prescriptionForWeek } from '../plans/weekPrescription'
import { equipmentStep, recommend } from '../trainer/engine'
import { buildEvidence, isDoubleAngleFollower } from '../trainer/evidence'
import { bucketFor, computeCalibration } from '../trainer/calibration'
import { buildExposures } from '../trainer/exposures'
import { nextSetHint } from '../trainer/setSignal'
import { buildWorkoutSummary, type WorkoutSummaryRow } from '../trainer/summary'
import TrainerRecommendationCard from '../trainer/TrainerRecommendationCard'
import { applyTrainerRecommendation, type TrainerChoice, type TrainerDraftValues } from '../trainer/draft'
import { trainerRangeLabel as formatTrainerRange, trainerReason } from '../trainer/presentation'
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
  swappedFrom?: string
  weekNote?: string
}

const swapEquipmentKeys: Record<string, TranslationKey> = {
  band: 'workout.swap.equipment.band',
  barbell: 'workout.swap.equipment.barbell',
  bodyweight: 'workout.swap.equipment.bodyweight',
  cable: 'workout.swap.equipment.cable',
  dumbbell: 'workout.swap.equipment.dumbbell',
  'ez-bar': 'workout.swap.equipment.ezBar',
  'hex-bar': 'workout.swap.equipment.hexBar',
  kettlebell: 'workout.swap.equipment.kettlebell',
  machine: 'workout.swap.equipment.machine',
  'plate-loaded': 'workout.swap.equipment.plateLoaded',
  'smith-machine': 'workout.swap.equipment.smithMachine',
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
  setAt?: Array<number | undefined>
  notes: string
} & TrainerDraftValues

type PlanMode = 'preset' | 'custom'

type LogToast = {
  recommendations: Array<{ exerciseKey: string; target: NextTarget; why: string }>
  undoSnapshots: UndoSnapshot[]
}

type DaySessionSummary = SessionSummary & {
  nextSession?: string
  performance: WorkoutSummaryRow[]
  date: string
  blockId?: string
  dayKey?: string
}

function SteppedNumberInput({
  value,
  step,
  min,
  label,
  decreaseLabel,
  increaseLabel,
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
  decreaseLabel: string
  increaseLabel: string
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
        aria-label={decreaseLabel}
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
        aria-label={increaseLabel}
        onClick={() => onChange(String(stepWorkoutValue(value, 1, step, min)))}
      >
        +
      </button>
    </div>
  )
}

const CUSTOM_PLAN_KEY = 'gym-studio.custom-plan'
const BLOCK_CARD_EXPANDED_KEY = 'gym-studio.block-card-expanded'

function createRecommendationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

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

function formatTechniqueLabel(technique: NonNullable<PlanExercise['technique']>, t: ReturnType<typeof useT>['t']) {
  const keys: Record<NonNullable<PlanExercise['technique']>, Parameters<typeof t>[0]> = {
    straight: 'workout.technique.straight',
    superset: 'workout.technique.superset',
    'drop-set': 'workout.technique.dropSet',
    pyramid: 'workout.technique.pyramid',
    'reverse-pyramid': 'workout.technique.reversePyramid',
  }
  return t(keys[technique])
}

function formatBlockStartDate(language: ReturnType<typeof useT>['language'], value: string) {
  return formatWeekdayDate(language, `${value}T00:00:00Z`)
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

function formatHistoryDate(language: ReturnType<typeof useT>['language'], value: string) {
  return formatShortDate(language, value)
}

function formatBlockWeekRange(block: TrainingBlock, week: number, language: ReturnType<typeof useT>['language']) {
  const start = new Date(`${block.startDate}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7)
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  return `${formatShortDate(language, start.toISOString().slice(0, 10))} – ${formatShortDate(language, end.toISOString().slice(0, 10))}`
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

/** Keeps the image-search arrow glued to the last word so it never wraps onto a line of its own. */
function NameWithArrow({ name }: { name: string }) {
  const cut = name.lastIndexOf(' ')
  return (
    <>
      {cut > 0 ? name.slice(0, cut + 1) : ''}
      <span className="exercise-image-link-tail">
        {cut > 0 ? name.slice(cut + 1) : name}
        <svg className="exercise-image-link-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 16L16 8" />
          <path d="M9.5 8H16v6.5" />
        </svg>
      </span>
    </>
  )
}

export function ExerciseSwapButton({
  label,
  onClick,
}: {
  label: string
  onClick: React.MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <button
      type="button"
      className="exercise-swap-button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick(event)
      }}
    >
      {/* Dumbbell with a small swap badge (PO pick 2026-10-06, option B). */}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 9v6M17 9v6M4 10.5v3M20 10.5v3M7 12h10" />
      </svg>
      <span className="exercise-swap-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 8h12l-3-3M19 16H7l3 3" />
        </svg>
      </span>
    </button>
  )
}

export function ExerciseSwapSheet({
  alternatives,
  language,
  t,
  onCancel,
  onSelect,
}: {
  alternatives: Exercise[]
  language: Language
  t: Translate
  onCancel: () => void
  onSelect: (exerciseId: string, scope: ExerciseSwap['scope']) => void
}) {
  return (
    <section
      className="exercise-swap-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-swap-title"
      onClick={(event) => event.stopPropagation()}
    >
      <header className="exercise-swap-header">
        <h2 id="exercise-swap-title">{t('workout.swap.suggestions')}</h2>
        <button type="button" className="secondary-button" onClick={onCancel}>
          {t('workout.swap.cancel')}
        </button>
      </header>
      <div className="exercise-swap-suggestions">
        {alternatives.map((alternative) => (
          <article className="exercise-swap-suggestion" key={alternative.id}>
            <a
              className="exercise-swap-name exercise-image-link"
              href={exerciseImageSearchUrl(exerciseImageQuery(alternative.id, getExerciseDisplayName(alternative, language), alternative.equipment))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('workout.exercise.imageSearch', { name: getExerciseDisplayName(alternative, language) })}
              onClick={(event) => {
                event.stopPropagation()
                event.preventDefault()
                void openExternal(event.currentTarget.href)
              }}
            >
              <NameWithArrow name={getExerciseDisplayName(alternative, language)} />
            </a>
            <div className="chip-row chip-row-tight">
              <span className="chip">{t('workout.swap.muscle')}: {localizeMuscle(alternative.primaryMuscle, language)}</span>
              {alternative.equipment && (
                <span className="chip subtle">
                  {t('workout.swap.equipment')}: {
                    swapEquipmentKeys[alternative.equipment]
                      ? t(swapEquipmentKeys[alternative.equipment])
                      : alternative.equipment
                  }
                </span>
              )}
            </div>
            <div className="exercise-swap-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onSelect(alternative.id, 'today')}
              >
                {t('workout.swap.justToday')}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => onSelect(alternative.id, 'always')}
              >
                {t('workout.swap.always')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
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
  authStatus = 'signed-out',
  authUserId = null,
  onSignIn,
  onCreatePlan,
  onStartRest,
}: {
  mode?: PlanMode
  lockMode?: boolean
  authStatus?: AuthStatus
  authUserId?: string | null
  onSignIn: () => void
  onCreatePlan?: () => void
  onStartRest: (durationSeconds: number, label?: string) => void
}) {
  const { t, language, locale } = useT()
  const demoMode = isDemoMode()
  const [planMode, setPlanMode] = useState<PlanMode>(mode ?? 'preset')
  const [selectedDay, setSelectedDay] = useState('chest-back-a')
  const [customPlan, setCustomPlan] = useState<PlanExercise[]>(() => loadCustomPlan())
  const [customExerciseDraft, setCustomExerciseDraft] = useState<PlanExercise>(defaultCustomExercise)
  const [selectedLibraryExerciseId, setSelectedLibraryExerciseId] = useState('')
  const [logError, setLogError] = useState<Record<string, string>>({})
  const [rawExerciseCatalog, setExerciseCatalog] = useState<Exercise[]>([])
  const [rawTrainingBlocks, setTrainingBlocks] = useState<TrainingBlock[]>([])
  const [exerciseSwaps, setExerciseSwaps] = useState<ExerciseSwap[]>(() => loadLocalExerciseSwaps())
  const [blocksLoaded, setBlocksLoaded] = useState(false)
  const today = getTodayIsoDate()
  // Spanish fitness content (PT-approved) overlays the English source; ids, keys and codes are unchanged.
  const spanishReady = useSpanishContentReady(language)
  const exerciseCatalog = useMemo(() => localizeCatalogue(rawExerciseCatalog, language), [rawExerciseCatalog, language, spanishReady])
  const trainingBlocks = useMemo(() => localizeBlocks(
    applySwaps(rawTrainingBlocks, activeSwaps(exerciseSwaps, today), new Set(rawExerciseCatalog.map((exercise) => exercise.id))),
    language
  ), [rawTrainingBlocks, exerciseSwaps, today, rawExerciseCatalog, language, spanishReady])
  const [selectedBlockId, setSelectedBlockId] = useState(() => getActiveBlockId() ?? '')
  const [pinnedBlockId, setPinnedBlockId] = useState(() => getActiveBlockId() ?? '')
  const [blockCardExpanded, setBlockCardExpanded] = useState(
    () => getSessionStorageValue(BLOCK_CARD_EXPANDED_KEY) === 'true'
  )
  const [blockSelectorOpen, setBlockSelectorOpen] = useState(false)
  const [blockInsightsOpen, setBlockInsightsOpen] = useState(false)
  const [swapTarget, setSwapTarget] = useState<{ exercise: Exercise; fromExerciseId: string } | null>(null)
  const [history, setHistory] = useState<WorkoutEntry[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getTodayIsoDate)
  const [selectedCalendarBlockId, setSelectedCalendarBlockId] = useState('')
  const [plannedDrafts, setPlannedDrafts] = useState<Record<string, PlanDraft>>({})
  const [dismissedSetHints, setDismissedSetHints] = useState<Record<string, boolean>>({})
  const [dismissedRirEntries, setDismissedRirEntries] = useState<Record<string, boolean>>({})
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({})
  const [completedSupersetSets, setCompletedSupersetSets] = useState<Record<string, boolean[]>>({})
  const [completedSupersetAt, setCompletedSupersetAt] = useState<Record<string, Array<number | undefined>>>({})
  const [supersetLogOpen, setSupersetLogOpen] = useState<Record<string, boolean>>({})
  const [progressSectionsVisible, setProgressSectionsVisible] = useState<Record<string, boolean>>({})
  const [postureTipsVisible, setPostureTipsVisible] = useState<Record<string, boolean>>({})
  const [loggedAtByExercise, setLoggedAtByExercise] = useState<Record<string, number>>({})
  const [toast, setToast] = useState<LogToast | null>(null)
  const [sessionSummary, setSessionSummary] = useState<DaySessionSummary | null>(null)
  const sessionStartedAt = useRef<SessionStart | null>(null)
  const trainerRecommendationIds = useRef(new Map<string, string>())
  // Continuous learning (PT spec, approved 2026-10-07): the user's past recommendations + results calibrate the engine.
  const [calibrationRows, setCalibrationRows] = useState<Awaited<ReturnType<typeof fetchCalibrationRecommendations>>>([])
  useEffect(() => {
    if (demoMode || authStatus !== 'signed-in') return
    let cancelled = false
    void fetchCalibrationRecommendations()
      .then((rows) => { if (!cancelled) setCalibrationRows(rows) })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [authStatus, demoMode, history.length])
  const calibrationExposures = useMemo(
    () => buildExposures(calibrationRows, history, trainingBlocks, exerciseCatalog),
    [calibrationRows, history, trainingBlocks, exerciseCatalog]
  )
  // Phase 4: PT sentence from the AI for the engine's decision; the template sentence shows until (or unless) it arrives.
  const [trainerExplanations, setTrainerExplanations] = useState<Record<string, string>>({})
  const requestedExplanations = useRef(new Set<string>())
  const trainerWhy = (
    exerciseId: string | undefined,
    recommendation: Parameters<typeof explanationPayload>[0],
    original: Parameters<typeof explanationPayload>[1],
    template: string
  ) => {
    if (!exerciseId || demoMode || authStatus !== 'signed-in') return template
    const key = explanationKey(exerciseId, today, recommendation, language)
    const known = trainerExplanations[key] ?? loadTrainerExplanation(key)
    if (known) return known
    if (!requestedExplanations.current.has(key)) {
      requestedExplanations.current.add(key)
      const payload = explanationPayload(recommendation, original)
      void explainTrainerRecommendation(exerciseId, payload, language)
        .then((response) => {
          const text = validateExplanation(response.answer, payload)
          if (!text) return
          saveTrainerExplanation(key, text)
          setTrainerExplanations((current) => ({ ...current, [key]: text }))
        })
        .catch(() => undefined)
    }
    return template
  }
  const swapChangesDuringLoad = useRef(new Set<string>())

  const dismissSessionSummary = () => {
    setSessionSummary(null)
  }

  useEffect(() => {
    if (!blockSelectorOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBlockSelectorOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [blockSelectorOpen])

  useEffect(() => {
    if (!swapTarget) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSwapTarget(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [swapTarget])

  const text = {
    sets: t('workout.label.sets'),
    reps: t('workout.label.reps'),
    repsShort: t('workout.label.repsShort'),
    rest: t('workout.label.rest'),
    progress: t('workout.label.progress'),
    comments: t('workout.label.comments'),
    noProgressHistory: t('workout.progress.empty'),
    posture: t('workout.posture.title'),
    modeCustom: t('workout.mode.custom'),
    customTitle: t('workout.custom.title'),
    customHint: t('workout.custom.hint'),
    customName: t('workout.custom.name'),
    customSets: t('workout.custom.sets'),
    customReps: t('workout.custom.reps'),
    customRest: t('workout.custom.rest'),
    customFocus: t('workout.custom.focus'),
    customGoal: t('workout.custom.goal'),
    customTip: t('workout.custom.tip'),
    customAdd: t('workout.custom.add'),
    customLibrary: t('workout.custom.library'),
    customLibraryPlaceholder: t('workout.custom.libraryPlaceholder'),
    customAddLibrary: t('workout.custom.addLibrary'),
    customEmpty: t('workout.custom.empty'),
    customRemove: t('workout.custom.remove'),
    customBadge: t('workout.custom.badge'),
    calendar: t('workout.calendar.title'),
    close: t('workout.action.close'),
    calendarSelect: t('workout.calendar.selectDate'),
    calendarHistory: t('workout.calendar.history'),
    calendarEmpty: t('workout.calendar.empty'),
    changeBlock: t('workout.block.change'),
    coach: t('workout.block.coach'),
    pt: t('workout.block.pt'),
  }
  const setLabel = (count: number) => t(count === 1 ? 'workout.set.one' : 'workout.set.other', { count })
  const roundWord = (count: number) => t(count === 1 ? 'workout.round.word.one' : 'workout.round.word.other')
  const displayExerciseName = (exerciseOrName: Exercise | string) => {
    // Plan rows store the English name; in Spanish show the catalogue's Spanish name when there is one.
    if (typeof exerciseOrName === 'string' && language === 'es') {
      const key = normalizeExerciseName(exerciseOrName)
      const match = exerciseCatalog.find((item) => normalizeExerciseName(item.name) === key)
      if (match?.nameEs?.trim()) return match.nameEs
    }
    return getExerciseDisplayName(exerciseOrName, language)
  }
  const blockStatusKey = {
    Current: 'workout.block.status.current',
    Upcoming: 'workout.block.status.upcoming',
    Completed: 'workout.block.status.completed',
  } as const

  const activeBlock = useMemo(
    () =>
      trainingBlocks.find((block) => block.id === selectedBlockId) ??
      defaultActiveBlock(trainingBlocks, today),
    [selectedBlockId, today, trainingBlocks]
  )
  const activeBlockWeek = activeBlock ? blockWeek(activeBlock, today) : null
  const selectedCalendarBlock = trainingBlocks.find((block) => block.id === selectedCalendarBlockId)
  const calendarBlockSessions = useMemo(
    () => selectedCalendarBlock ? completedTrainingSessions(selectedCalendarBlock, history) : [],
    [history, selectedCalendarBlock]
  )
  const activeDay = activeBlock?.days.find((day) => day.key === selectedDay) ?? activeBlock?.days[0]
  const activeBlockExercises = useMemo(
    () =>
      activeDay?.exercises.map((exercise) => {
        const prescription = prescriptionForWeek(exercise, activeBlockWeek ?? 1)
        return {
          name: getBlockExerciseName(prescription, exerciseCatalog),
          sets: String(prescription.sets),
          reps: prescription.reps.join(' · '),
          repsPerSet: prescription.reps,
          rest: `${prescription.restSeconds} s`,
          restSeconds: prescription.restSeconds,
          focus: activeDay.focus ?? '',
          goal: '',
          tip: '',
          exerciseId: prescription.exerciseId,
          code: prescription.code,
          technique: prescription.technique,
          angleDegrees: prescription.angleDegrees,
          notes: prescription.notes,
          weekNote: prescription.weekNote,
          swappedFrom: prescription.swappedFrom,
        }
      }) ?? [],
    [activeBlockWeek, activeDay, exerciseCatalog]
  )
  const activeExercises = planMode === 'preset' ? activeBlockExercises : customPlan
  const swapSuggestions = swapTarget
    ? suggestAlternatives(
        swapTarget.exercise,
        exerciseCatalog,
        activeExercises.flatMap((exercise) => exercise.exerciseId ? [exercise.exerciseId] : [])
      )
    : []
  const todayDay = activeBlock ? todayTrainingDay(activeBlock, history, today) : undefined
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
  const chooseExerciseSwap = (toExerciseId: string, scope: ExerciseSwap['scope']) => {
    if (!swapTarget) return
    const fromExerciseId = swapTarget.fromExerciseId
    swapChangesDuringLoad.current.add(fromExerciseId)
    const remaining = exerciseSwaps.filter((swap) =>
      swap.fromExerciseId !== fromExerciseId || (scope === 'today' && swap.scope === 'always')
    )
    const nextSwap: ExerciseSwap = scope === 'today'
      ? { fromExerciseId, toExerciseId, scope, date: today }
      : { fromExerciseId, toExerciseId, scope }
    setExerciseSwaps(saveLocalExerciseSwaps([...remaining, nextSwap], today))
    setSwapTarget(null)
    if (scope === 'always' && authStatus === 'signed-in' && !demoMode) {
      void saveExerciseSwap(fromExerciseId, toExerciseId).catch(() => undefined)
    }
  }
  const undoExerciseSwap = (fromExerciseId: string) => {
    swapChangesDuringLoad.current.add(fromExerciseId)
    const hasTodaySwap = exerciseSwaps.some(
      (swap) => swap.fromExerciseId === fromExerciseId && swap.scope === 'today' && swap.date === today
    )
    const removePermanentSwap = !hasTodaySwap && exerciseSwaps.some(
      (swap) => swap.fromExerciseId === fromExerciseId && swap.scope === 'always'
    )
    setExerciseSwaps(saveLocalExerciseSwaps(
      exerciseSwaps.filter((swap) =>
        swap.fromExerciseId !== fromExerciseId || (hasTodaySwap && swap.scope === 'always')
      ),
      today
    ))
    if (removePermanentSwap && authStatus === 'signed-in' && !demoMode) {
      void removeExerciseSwap(fromExerciseId).catch(() => undefined)
    }
  }
  const findExerciseCompletion = (exercise: PlanExercise, entries: WorkoutEntry[]) => {
    const exerciseKey = normalizeExerciseName(exercise.name)
    const matching = entries.filter((entry) => {
      if (exercise.exerciseId) return entry.exerciseId === exercise.exerciseId
      const match = exerciseCatalog.find((item) => item.id === entry.exerciseId)
      return match && normalizeExerciseName(match.name) === exerciseKey
    })
    return findWeekCompletion(matching, activeCompletionScope)
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
    const signedIn = authStatus === 'signed-in' && !demoMode
    const localSwaps = loadLocalExerciseSwaps()
    setExerciseSwaps(localSwaps)
    const cachedPlan = signedIn ? getCachedActiveUserPlan() : null
    const globalCache = demoMode ? [] : getCachedTrainingBlocks() ?? []
    const cachedBlocks = selectPlanBlocks(globalCache, cachedPlan, signedIn, demoMode)
    const apply = (
      exercises: Exercise[],
      entries: WorkoutEntry[],
      blocks: TrainingBlock[],
      selectDay: boolean,
      personalPlan: boolean,
    ) => {
      if (cancelled) return
      setExerciseCatalog(exercises)
      setHistory(entries)
      setTrainingBlocks(blocks)
      setBlocksLoaded(true)
      const selectedBlockExists = blocks.some((block) => block.id === selectedBlockId)
      if (!selectDay && !personalPlan && selectedBlockExists) return
      const savedBlockId = personalPlan ? null : getActiveBlockId()
      const pinnedBlock = savedBlockId ? blocks.find((block) => block.id === savedBlockId) : undefined
      const nextBlock = pinnedBlock ?? defaultActiveBlock(blocks, getTodayIsoDate())
      if (savedBlockId && !pinnedBlock) setActiveBlockId(null)
      setPinnedBlockId(pinnedBlock?.id ?? '')
      setSelectedBlockId(nextBlock?.id ?? '')
      setSelectedDay(nextBlock ? todayTrainingDay(nextBlock, entries)?.key ?? '' : '')
    }
    void Promise.all([loadExercises(), loadWorkoutHistory()]).then(([exercises, entries]) => {
      if (cachedBlocks.length) apply(exercises, entries, cachedBlocks, true, !!cachedPlan)
      void Promise.all([
        demoMode ? loadDemoBlocks() : fetchTrainingBlocks(),
        signedIn ? fetchActiveUserPlan().catch(() => null) : Promise.resolve(null),
        signedIn ? fetchExerciseSwaps().catch(() => null) : Promise.resolve(null),
      ]).then(([globalBlocks, activePlan, remoteSwaps]) => {
        if (cancelled) return
        if (remoteSwaps) {
          const currentLocalSwaps = loadLocalExerciseSwaps()
          const changedSources = swapChangesDuringLoad.current
          const swaps: ExerciseSwap[] = [
            ...currentLocalSwaps.filter((swap) =>
              swap.scope === 'today' || changedSources.has(swap.fromExerciseId)
            ),
            ...remoteSwaps
              .filter((swap) => !changedSources.has(swap.fromExerciseId))
              .map((swap) => ({ ...swap, scope: 'always' as const })),
          ]
          changedSources.clear()
          setExerciseSwaps(saveLocalExerciseSwaps(swaps, today))
        }
        const blocks = selectPlanBlocks(globalBlocks, activePlan, signedIn, demoMode)
        apply(exercises, entries, blocks, !cachedBlocks.length, !!(signedIn && activePlan))
      })
    })

    return () => {
      cancelled = true
    }
  }, [authStatus, authUserId, demoMode])

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
            name: exercise ? displayExerciseName(exercise) : t('workout.exercise.unknown'),
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
    [displayExerciseName, exerciseCatalog, history, selectedCalendarDate, t]
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
    `${planMode === 'preset' ? `${activeBlock?.id ?? ''}:${activeDay?.key ?? ''}:${today}` : 'custom'}:${normalizeExerciseName(exerciseName)}`

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

  const getRawDefaultSetCount = (exercise: PlanExercise) => {
    const raw = exercise.sets ?? '1'
    const match = raw.match(/(\d+)/)
    return match ? Number(match[1]) : 1
  }

  const getDefaultSetCount = (exercise: PlanExercise) => {
    return getRawDefaultSetCount(exercise)
  }

  const getNextTarget = (
    exercise: PlanExercise,
    sets: Pick<WorkoutSet, 'weight' | 'reps'>[],
    deload = planMode === 'preset' && activeBlockWeek === 6
  ) => {
    const exerciseInfo =
      exerciseCatalog.find((item) => item.id === exercise.exerciseId) ??
      exerciseCatalog.find((item) => normalizeExerciseName(item.name) === normalizeExerciseName(exercise.name))
    const progressionType: ProgressionType = exerciseInfo?.mechanic === 'isolation'
      ? 'isolation'
      : /lower|leg|glute/i.test(exerciseInfo?.bodyRegion ?? exercise.focus)
        ? 'lower'
        : 'upper'
    const targetReps = getExerciseTargetReps(exercise)
    return recommendNextTarget(sets, targetReps, progressionType, deload)
  }

  const getExerciseTargetReps = (exercise: PlanExercise) =>
    Array.from({ length: getRawDefaultSetCount(exercise) }, (_, index) => {
      const prescription = exercise.repsPerSet?.[index] ?? exercise.reps ?? ''
      const values = prescription.match(/\d+/g)?.map(Number) ?? []
      return Math.max(...values, 0)
    }).filter((reps) => reps > 0)

  const getNextTargetWhy = (target: NextTarget) => {
    if (target.action === 'deload') return t('workout.nextTarget.why.deload')
    if (target.action === 'reduce') return t('workout.nextTarget.why.reduce')
    if (target.action === 'increase' && target.firstSetAboveTarget) {
      return t('workout.nextTarget.why.firstSet')
    }
    if (target.action === 'increase') {
      return t('workout.nextTarget.why.increase', { increase: formatNumber(language, target.increaseKg) })
    }
    return t('workout.nextTarget.why.hold', {
      sets: target.shortSets.map((set) => t('workout.nextTarget.set', { set })).join(', '),
      reps: target.reps[0] ?? 0,
    })
  }

  const getNextTargetLabel = (target: NextTarget) =>
    t('workout.nextTarget.label', {
      weight: formatNumber(language, target.weight),
      reps: target.reps[0] ?? 0,
      sets: target.setCount,
    })

  const getOriginalDraftForExercise = (exerciseName: string, exercise?: PlanExercise): PlanDraft => {
    const key = getPlanDraftKey(exerciseName)
    const best = bestProgressByName.get(normalizeExerciseName(exerciseName))
    const bestReps = best && best.sets.length ? Math.max(...best.sets.map((set) => set.reps), 0) : 8
    const fallbackReps = exercise ? getDefaultRepTarget(exercise) : bestReps
    const fallbackSetCount = exercise ? getDefaultSetCount(exercise) : 1
    const prefillExerciseId =
      exercise?.exerciseId ??
      exerciseCatalog.find((item) => normalizeExerciseName(item.name) === normalizeExerciseName(exerciseName))?.id
    const prefillSelection = planMode === 'custom' && exercise && prefillExerciseId
      ? findPrefillSelection(history, prefillExerciseId)
      : undefined
    const prefill = planMode === 'preset' && prefillExerciseId
      ? history
          .filter((entry) => entry.exerciseId === prefillExerciseId && entry.sets.length > 0 &&
            (entry.date !== today || (!!activeDay && entry.dayKey !== activeDay.key)))
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))[0]
      : prefillSelection?.entry
    const noSwapHistory = !!exercise?.swappedFrom &&
      !history.some((entry) => entry.exerciseId === prefillExerciseId &&
        (entry.date !== today || (!!activeDay && entry.dayKey !== activeDay.key)))
    const bestWeight = noSwapHistory
      ? 0
      : planMode === 'preset'
        ? prefill ? workoutMaxWeight(prefill.sets) : 0
        : best ? workoutMaxWeight(best.sets) : 0
    const nextTarget = planMode === 'custom' && exercise && prefill ? getNextTarget(exercise, prefill.sets) : null
    const lastWeights = Array.from({ length: fallbackSetCount }, (_, index) => {
      const source = prefill ? prefill.sets[index] ?? prefill.sets[prefill.sets.length - 1] : undefined
      const weight = Number(source?.weight ?? bestWeight) || 0
      return planMode === 'custom' && prefillSelection?.basis === 'other-day'
        ? scaleWeightForOtherDay(weight, source?.reps, exercise ? getExerciseTargetReps(exercise)[index] : undefined)
        : weight
    })
    const baseSetWeights = nextTarget
      ? Array.from({ length: fallbackSetCount }, () => nextTarget.weight)
      : lastWeights
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

    return {
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
  }

  const getTrainerRecommendationId = (key: string) => {
    const id = trainerRecommendationIds.current.get(key)
    if (id) return id
    const nextId = createRecommendationId()
    trainerRecommendationIds.current.set(key, nextId)
    return nextId
  }

  const getDraftForExercise = (exerciseName: string, exercise?: PlanExercise) => {
    const key = getPlanDraftKey(exerciseName)
    const saved = plannedDrafts[key]
    if (saved) return saved
    const original = getOriginalDraftForExercise(exerciseName, exercise)
    return planMode === 'preset' && exercise?.exerciseId
      ? { ...original, recommendationId: getTrainerRecommendationId(key) }
      : original
  }

  // PT spec R5: a double-angle follower ("Same dumbbells as …") uses the previous exercise's recommended load today.
  const followLoadFor = (exercise: PlanExercise): number | undefined => {
    if (!isDoubleAngleFollower(exercise.notes) || !activeDay) return undefined
    const index = activeBlockExercises.findIndex((item) => item.code === exercise.code)
    const leader = index > 0 ? activeBlockExercises[index - 1] : undefined
    const leaderTrainer = leader ? getTrainerRecommendation(leader) : null
    return leaderTrainer?.recommendation.weight ?? undefined
  }

  const getTrainerRecommendation = (exercise: PlanExercise): ReturnType<typeof buildTrainerRecommendation> => buildTrainerRecommendation(exercise)

  const buildTrainerRecommendation = (exercise: PlanExercise) => {
    if (planMode !== 'preset' || !activeBlock || !activeDay || !exercise.exerciseId) return null
    const original = getOriginalDraftForExercise(exercise.name, exercise)
    // First number of each set ("12+12" drop-set → 12): the main-set reps the PT spec progresses on.
    const reps = (exercise.repsPerSet ?? [exercise.reps ?? '8']).map((rep) => parseRepPrescription(rep)[0]).filter((rep) => rep > 0)
    const target = reps.length
      ? { min: Math.min(...reps), max: Math.max(...reps) }
      : { min: 8, max: 8 }
    const planned = activeDay.exercises.find((item) => item.exerciseId === exercise.exerciseId)
    const plannedSets = planned?.sets ?? getDefaultSetCount(exercise)
    const equipment = exerciseCatalog.find((item) => item.id === exercise.exerciseId)?.equipment
    const evidence = buildEvidence(history, exercise.exerciseId, trainingBlocks, today, activeDay.key)
    const recommendation = recommend({
      history: evidence,
      today,
      target,
      sets: plannedSets,
      equipment,
      plannedWeight: original.weight > 0 ? original.weight : undefined,
      deload: activeBlockWeek === 6,
      technique: exercise.technique,
      setReps: reps,
      tempo: /\btempo\b/i.test(exercise.notes ?? ''),
      followLoad: followLoadFor(exercise),
      calibrationOffset: computeCalibration(
        calibrationExposures,
        today,
        {
          exerciseId: exercise.exerciseId,
          pattern: exerciseCatalog.find((item) => item.id === exercise.exerciseId)?.movementPattern,
          bucket: bucketFor(exercise.technique),
        },
        history.map((entry) => entry.date.slice(0, 10)).filter((date) => date < today)
      ).offset,
    })
    return {
      recommendation,
      original,
      target,
      evidence,
      id: getTrainerRecommendationId(getPlanDraftKey(exercise.name)),
    }
  }

  const trainerRangeLabel = (range: { min: number; max: number }) => formatTrainerRange(range, language)

  const saveTrainerChoice = (
    exercise: PlanExercise,
    choice: TrainerChoice,
    context: NonNullable<ReturnType<typeof getTrainerRecommendation>>
  ) => {
    const key = getPlanDraftKey(exercise.name)
    const current = getDraftForExercise(exercise.name, exercise)
    const updated = applyTrainerRecommendation(current, context.recommendation, choice, context.original)
    const nextDraft = { ...current, ...updated, recommendationId: context.id }
    setPlannedDrafts((drafts) => ({ ...drafts, [key]: nextDraft }))
    saveTrainerResult(exercise, nextDraft, context)
  }

  const saveTrainerResult = (
    exercise: PlanExercise,
    draft: PlanDraft,
    context: NonNullable<ReturnType<typeof getTrainerRecommendation>>,
    resultEntryId?: string
  ) => {
    if (authStatus !== 'signed-in' || demoMode || !exercise.exerciseId) return
    const row: TrainerRecommendationRow = {
      id: draft.recommendationId ?? context.id,
      exerciseId: exercise.exerciseId,
      date: today,
      blockId: activeBlock?.id,
      dayKey: activeDay?.key,
      original: {
        weight: context.original.weight > 0 ? context.original.weight : null,
        reps: context.target,
        sets: getDefaultSetCount(exercise),
      },
      recommended: {
        weight: context.recommendation.weight,
        reps: context.recommendation.reps,
        sets: context.recommendation.sets,
      },
      action: context.recommendation.action,
      reason: context.recommendation.reason,
      confidence: context.recommendation.confidence,
      evidence: context.recommendation.evidence,
      status: draft.trainerChoice ?? 'shown',
      ...(resultEntryId ? { resultEntryId } : {}),
    }
    void saveTrainerRecommendation(row).catch(() => undefined)
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
    const nextSetAt = Array.from({ length: setCount }, (_, index) => currentDraft.setAt?.[index])
    nextCompleted[setIndex] = !nextCompleted[setIndex]
    nextSetAt[setIndex] = nextCompleted[setIndex] ? Date.now() : undefined
    setPlannedDrafts((current) => ({
      ...current,
      [key]: { ...(current[key] ?? currentDraft), setDone: nextCompleted, setAt: nextSetAt },
    }))
    if (nextCompleted.every(Boolean)) void logPlannedExercise(exercise, nextCompleted, nextSetAt)
  }

  const useSetHint = (exercise: PlanExercise, setCount: number, weight: number) => {
    const key = getPlanDraftKey(exercise.name)
    const fallback = getDraftForExercise(exercise.name, exercise)
    setPlannedDrafts((current) => {
      const draft = current[key] ?? fallback
      const setWeights = Array.from(
        { length: setCount },
        (_, index) => draft.setWeights[index] ?? draft.weight
      )
      const setWeightTouched = Array.from(
        { length: setCount },
        (_, index) => draft.setWeightTouched[index] ?? (setWeights[index] !== 0)
      )
      setWeights.forEach((_, index) => {
        if (draft.setDone[index]) return
        setWeights[index] = weight
        setWeightTouched[index] = true
      })
      return {
        ...current,
        [key]: {
          ...draft,
          weight: setWeights[0] ?? draft.weight,
          setWeights,
          setWeightTouched,
        },
      }
    })
  }

  const saveSetRir = (entry: WorkoutEntry, rir: number) => {
    const nextHistory = history.map((item) => {
      if (item.id !== entry.id || item.sets.length === 0) return item
      const lastIndex = item.sets.length - 1
      return {
        ...item,
        sets: item.sets.map((set, index) => index === lastIndex ? { ...set, rir } : set),
      }
    })
    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    setDismissedRirEntries((current) => ({ ...current, [entry.id]: true }))
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
    setSelectedDay(block ? todayTrainingDay(block, history, today)?.key ?? '' : '')
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
    scope: typeof activeCompletionScope,
    exercises: PlanExercise[]
  ) => {
    setToast({
      recommendations: entries.flatMap((entry) => {
        const exercise = exercises.find((item) =>
          item.exerciseId === entry.exerciseId ||
          normalizeExerciseName(item.name) === normalizeExerciseName(
            exerciseCatalog.find((catalogueItem) => catalogueItem.id === entry.exerciseId)?.name ??
              entry.exerciseId.replace(/-custom$/, '')
          )
        )
        // Old rule only for custom plans; preset plans use the AI Trainer engine (single source of recommendations).
        const target = planMode === 'custom' && exercise ? getNextTarget(exercise, entry.sets) : null
        return target && exercise
          ? [{ exerciseKey: normalizeExerciseName(exercise.name), target, why: getNextTargetWhy(target) }]
          : []
      }),
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
    const performance = buildWorkoutSummary(entries, nextHistory, trainingBlocks, exerciseCatalog, today)
    const nextDay = nextUnloggedDay(activeBlock, nextHistory, today)
    const scopeKey = getSessionScopeKey(activeCompletionScope, planMode)
    setSessionSummary({
      ...createSessionSummary(
        entries,
        sessionDurationMs(sessionStartedAt.current, scopeKey, loggedAt),
        nextHistory,
        trainingBlocks,
        language
      ),
      nextSession: nextDay ? t('workout.day.title', { position: nextDay.position, name: nextDay.name }) : undefined,
      performance,
      date: activeCompletionScope.date,
      blockId: activeCompletionScope.blockId,
      dayKey: activeCompletionScope.dayKey,
    })
  }

  const undoLastLog = () => {
    if (!toast) return
    const nextHistory = undoLoggedEntries(history, toast.undoSnapshots)
    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    setToast(null)
    dismissSessionSummary()
  }

  const logPlannedExercise = async (
    exercise: PlanExercise,
    completedRows?: boolean[],
    completedAt?: Array<number | undefined>
  ) => {
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
    const trainer = getTrainerRecommendation(exercise)
    const setCount = getDefaultSetCount(exercise) || 1
    const allSets = Array.from({ length: setCount }, (_, index) => {
      const currentWeight = draft.setWeights?.[index] ?? draft.weight ?? 0
      const currentReps = draft.setReps?.[index] ?? draft.reps ?? getDefaultRepTarget(exercise)
      const set = createSet(Number(currentReps) || getDefaultRepTarget(exercise), Number(currentWeight) || 0)
      const setAt = completedAt?.[index] ?? draft.setAt?.[index]
      if (setAt !== undefined) set.at = setAt
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
      setLogError((current) => ({ ...current, [exerciseKey]: t('workout.error.enterSet') }))
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
      ...(trainer ? {
        target: {
          sets: setCount,
          reps: draft.trainerChoice === 'accepted' ? trainer.recommendation.reps : trainer.target,
          weight: draft.setWeights[0] ?? draft.weight,
          technique: exercise.technique,
          recommendationId: draft.recommendationId ?? trainer.id,
        },
      } : {}),
      ...(planMode === 'preset' && activeBlock && activeDay
        ? { blockId: activeBlock.id, dayKey: activeDay.key }
        : {}),
      notes: draft.notes?.trim() ?? '',
    }

    const storedHistory = await loadWorkoutHistory()
    const { history: nextHistory, entry: entryToSave } = upsertScopedEntry(storedHistory, nextEntry, activeCompletionScope)
    if (trainer) saveTrainerResult(exercise, draft, trainer, entryToSave.id)
    const loggedAt = Date.now()
    startSession(loggedAt, activeCompletionScope)

    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    onStartRest(exercise.restSeconds ?? 90, displayExerciseName(exercise.name))
    showLogToast([entryToSave], storedHistory, activeCompletionScope, [exercise])
    maybeShowSessionSummary(storedHistory, nextHistory, loggedAt)
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
          setAt: Array.from({ length: setCount }, () => undefined),
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

  const logSuperset = async (
    exercises: PlanExercise[],
    groupKey: string,
    completedRows: boolean[],
    completedAt?: Array<number | undefined>
  ) => {
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
        const setAt = completedAt?.[index]
        if (setAt !== undefined) set.at = setAt
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
    const nextEntries = createSupersetEntries(entryInputs, { ...activeCompletionScope, date }).map((entry) => {
      const exercise = exercises.find((item) => item.exerciseId === entry.exerciseId)
      if (!exercise) return entry
      const trainer = getTrainerRecommendation(exercise)
      if (!trainer) return entry
      const draft = getDraftForExercise(exercise.name, exercise)
      return {
        ...entry,
        target: {
          sets: getDefaultSetCount(exercise),
          reps: draft.trainerChoice === 'accepted' ? trainer.recommendation.reps : trainer.target,
          weight: draft.setWeights[0] ?? draft.weight,
          technique: exercise.technique,
          recommendationId: draft.recommendationId ?? trainer.id,
        },
      }
    })

    if (nextEntries.length === 0) {
      setLogError((current) => ({
        ...current,
        ...Object.fromEntries(exercises.map((exercise) => [getPlanDraftKey(exercise.name), t('workout.error.enterSet')])),
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
    for (const entry of entriesToSave) {
      const exercise = exercises.find((item) => item.exerciseId === entry.exerciseId)
      if (!exercise) continue
      const trainer = getTrainerRecommendation(exercise)
      if (trainer) saveTrainerResult(exercise, getDraftForExercise(exercise.name, exercise), trainer, entry.id)
    }
    const loggedAt = Date.now()
    const scope = { ...activeCompletionScope, date }
    startSession(loggedAt, scope)
    showLogToast(entriesToSave, storedHistory, scope, exercises)
    maybeShowSessionSummary(storedHistory, nextHistory, loggedAt)

    setLogError((current) => ({
      ...current,
      ...Object.fromEntries(exercises.map((exercise) => [getPlanDraftKey(exercise.name), ''])),
    }))
    setHistory(nextHistory)
    saveWorkoutHistory(nextHistory)
    if (entriesToSave.length === exercises.length) {
      onStartRest(
        exercises[exercises.length - 1]?.restSeconds ?? 90,
        exercises.map((item) => displayExerciseName(item.name)).join(' + ')
      )
    }

    const exerciseKeys = exercises.map((exercise) => normalizeExerciseName(exercise.name))
    setPlannedDrafts((current) => Object.fromEntries(
      Object.entries(current).map(([key, draft]) =>
        exerciseKeys.some((exerciseKey) => key.endsWith(`:${exerciseKey}`))
          ? [key, { ...draft, notes: '' }]
          : [key, draft]
      )
    ))
    setCompletedSupersetSets((current) => {
      const { [groupKey]: _completedRows, ...remaining } = current
      return remaining
    })
    setCompletedSupersetAt((current) => {
      const { [groupKey]: _completedTimes, ...remaining } = current
      return remaining
    })
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

  if (planMode === 'preset' && blocksLoaded && trainingBlocks.length === 0) {
    const signedInUser = authStatus === 'signed-in' && !demoMode
    return (
      <section className="card welcome-card no-plan-card" aria-labelledby="no-plan-title">
        <h2 id="no-plan-title">{signedInUser ? t('noPlan.title') : t('noPlan.guestTitle')}</h2>
        {signedInUser && <p>{t('noPlan.message')}</p>}
        <div className="welcome-actions">
          {signedInUser ? (
            <button type="button" className="primary-button" onClick={onCreatePlan ?? onSignIn}>{t('noPlan.create')}</button>
          ) : (
            <>
              <button type="button" className="primary-button" onClick={onSignIn}>{t('noPlan.signIn')}</button>
              <a className="secondary-button" href="?demo=1">{t('noPlan.demo')}</a>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="card plan-card">
      <div className="section-title-row">
        {planMode === 'custom' && <h3>{text.customTitle}</h3>}
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
          <span className="plan-badge">{planMode === 'preset'
            ? t('workout.badge.block', { weeks: activeBlock?.weeks ?? 6, days: activeBlock?.days.length ?? 6 })
            : text.customBadge}</span>
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

            <section className="calendar-program" aria-labelledby="calendar-program-title">
              <strong id="calendar-program-title">{t('workout.calendar.program')}</strong>
              {trainingBlocks.length > 0 ? (
                <div className="calendar-block-list" role="list">
                  {[...trainingBlocks]
                    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.number - b.number)
                    .map((block) => {
                      const expanded = selectedCalendarBlockId === block.id
                      const currentWeek = blockWeek(block, today)
                      const weeks = Array.from({ length: block.weeks }, (_, index) => index + 1)
                      return (
                        <article className="calendar-block" key={block.id} role="listitem">
                          <button
                            type="button"
                            className="calendar-block-toggle"
                            aria-expanded={expanded}
                            aria-controls={`calendar-block-details-${block.id}`}
                            onClick={() => setSelectedCalendarBlockId(expanded ? '' : block.id)}
                          >
                            <span className="calendar-block-title-row">
                              <strong>{block.number === 0 ? block.name : t('workout.block.optionTitle', { number: block.number, name: block.name })}</strong>
                              <span className="calendar-block-status">
                                {t(blockStatusKey[trainingBlockDateStatus(block, today)])}
                              </span>
                            </span>
                            <span className="calendar-block-meta">
                              {blockDateRange(block, language)} · {formatBlockMethod(block.method, language)}
                            </span>
                          </button>
                          <div
                            className="calendar-week-list"
                            role="list"
                            aria-label={t('workout.calendar.weeks', { count: block.weeks })}
                            style={{ gridTemplateColumns: `repeat(${block.weeks}, minmax(0, 1fr))` }}
                          >
                            {weeks.map((week) => {
                              const isCurrentWeek = week === currentWeek
                              const weekRange = formatBlockWeekRange(block, week, language)
                              return (
                                <span
                                  key={week}
                                  className={isCurrentWeek ? 'calendar-week current' : 'calendar-week'}
                                  role="listitem"
                                  aria-current={isCurrentWeek ? 'date' : undefined}
                                  aria-label={t('workout.calendar.weekRange', { week, range: weekRange })}
                                >
                                  {t('workout.calendar.weekShort', { week })}
                                </span>
                              )
                            })}
                          </div>
                          {expanded && (
                            <div
                              className="calendar-block-details"
                              id={`calendar-block-details-${block.id}`}
                              role="group"
                              aria-label={block.name}
                            >
                              {[...block.days]
                                .sort((a, b) => a.position - b.position)
                                .map((day) => {
                                  const completedDates = calendarBlockSessions
                                    .filter((session) => session.dayKey === day.key)
                                    .map((session) => session.date)
                                  return (
                                    <article className="calendar-day" key={day.key}>
                                      <div className="calendar-day-heading">
                                        <strong>{day.name}</strong>
                                        {completedDates.map((date) => (
                                          <span className="calendar-session-completed" key={date}>
                                            <span aria-hidden="true">✓</span>
                                            {t('workout.calendar.completedSession', { date: formatHistoryDate(language, date) })}
                                          </span>
                                        ))}
                                      </div>
                                      {day.focus && <small className="calendar-day-focus">{day.focus}</small>}
                                      {day.exercises.length > 0 ? (
                                        <ul className="calendar-exercise-list">
                                          {[...day.exercises]
                                            .sort((a, b) => a.position - b.position)
                                            .map((exercise) => (
                                              <li key={`${exercise.position}-${exercise.exerciseId}`}>
                                                <span>
                                                  {displayExerciseName(
                                                    exerciseCatalog.find((item) => item.id === exercise.exerciseId) ??
                                                      exercise.exerciseId
                                                  )}
                                                </span>
                                                <small>
                                                  {t('workout.calendar.exercisePrescription', {
                                                    sets: exercise.sets,
                                                    reps: exercise.reps.join(' · '),
                                                  })}
                                                </small>
                                              </li>
                                            ))}
                                        </ul>
                                      ) : (
                                        <p className="calendar-no-exercises">{t('workout.calendar.noExercises')}</p>
                                      )}
                                    </article>
                                  )
                                })}
                            </div>
                          )}
                        </article>
                      )
                    })}
                </div>
              ) : (
                <p className="calendar-blocks-empty">{t('workout.calendar.blocksEmpty')}</p>
              )}
            </section>

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
                        <small>{t('workout.volume.value', { value: formatNumber(language, item.totalVolume) })}</small>
                        <small>{setLabel(item.setsCount)}</small>
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
        <div className="plan-mode-tabs" aria-label={t('workout.mode.aria')}>
          <button
            type="button"
            className={planMode === 'preset' ? 'tab-button active' : 'tab-button'}
            onClick={() => setPlanMode('preset')}
          >
            {t('workout.mode.preset', { weeks: activeBlock?.weeks ?? 6 })}
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
        <>
          <section className="training-block-card" aria-label={t('workout.block.activeAria')}>
            <button
              type="button"
              className="training-block-header"
              onClick={toggleBlockCard}
              aria-expanded={blockCardExpanded}
              aria-controls="training-block-content"
            >
              <span className="training-block-primary">
                {/* TODO(i18n): PT will provide approved translations */}
                <span className="training-block-name">{activeBlock.name}</span>
                <strong className="training-block-status">
                  {trainingBlockDateStatus(activeBlock, today) === 'Current'
                    ? t('workout.block.weekOf', { week: activeBlockWeek ?? 1, total: activeBlock.weeks })
                    : trainingBlockDateStatus(activeBlock, today) === 'Upcoming'
                      ? t('workout.block.starts', { date: formatBlockStartDate(language, activeBlock.startDate) })
                      : t('workout.block.completed')}
                </strong>
                <span className="toggle-button expand-toggle" aria-hidden="true">
                  {blockCardExpanded ? '−' : '+'}
                </span>
              </span>
              <span className="training-block-badges">
                <span className="training-block-number">{activeBlock.number === 0 ? t('workout.block.personal') : t('workout.block.number', { number: activeBlock.number })}</span>
                <span className="origin-badge">{activeBlock.origin === 'pt' ? text.pt : text.coach}</span>
                {pinnedBlockId === activeBlock.id && <span className="training-block-number">{t('workout.block.pinned')}</span>}
              </span>
            </button>
            {activeBlockWeek !== null && (
              <span className="chip subtle training-week-chip">
                {t(
                  activeBlockWeek === 6
                    ? 'workout.block.weekType.deload'
                    : 'workout.block.weekType.full'
                )}
              </span>
            )}
            <div id="training-block-content" className="training-block-content" hidden={!blockCardExpanded}>
              <button
                type="button"
                className="secondary-button block-change-button"
                onClick={() => setBlockSelectorOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={blockSelectorOpen}
              >
                {text.changeBlock}
              </button>
              <div className="training-block-meta">
                <span>{blockDateRange(activeBlock, language)}</span>
                <span>{formatBlockMethod(activeBlock.method, language)}</span>
              </div>
              {/* TODO(i18n): PT will provide approved translations */}
              <p>{activeBlock.summary}</p>
              <button
                type="button"
                className="about-block-toggle"
                onClick={() => setBlockInsightsOpen((current) => !current)}
                aria-expanded={blockInsightsOpen}
                aria-controls="training-block-insights"
              >
                {t('workout.block.about')}
                <span className="toggle-button expand-toggle" aria-hidden="true">
                  {blockInsightsOpen ? '−' : '+'}
                </span>
              </button>
              <div id="training-block-insights" className="training-block-insights" hidden={!blockInsightsOpen}>
                {activeBlock.insights.map((insight) => (
                  <section key={insight.title}>
                    {/* TODO(i18n): PT will provide approved translations */}
                    <h5>{insight.title}</h5>
                    <p>{insight.body}</p>
                  </section>
                ))}
              </div>
              {pinnedBlockId === activeBlock.id && (
                <button type="button" className="secondary-button block-change-button" onClick={useDateBasedBlock}>
                  {t('workout.block.useDateBased')}
                </button>
              )}
            </div>
          </section>
          {blockSelectorOpen && (
            <div className="block-selector-backdrop" role="presentation" onClick={() => setBlockSelectorOpen(false)}>
              <section
                className="block-selector-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="block-selector-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="block-selector-header">
                  <h2 id="block-selector-title">{text.changeBlock}</h2>
                  <button
                    type="button"
                    className="session-summary-close"
                    onClick={() => setBlockSelectorOpen(false)}
                    aria-label={t('workout.block.closeChooser')}
                  >
                    ×
                  </button>
                </header>
                <div className="block-selector-options">
                  {trainingBlocks.map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      className={block.id === activeBlock.id ? 'block-selector-option active' : 'block-selector-option'}
                      aria-pressed={block.id === activeBlock.id}
                      onClick={() => {
                        setActiveBlockId(block.id)
                        setPinnedBlockId(block.id)
                        setSelectedBlockId(block.id)
                        setSelectedDay(todayTrainingDay(block, history, today)?.key ?? block.days[0]?.key ?? '')
                        setCollapsedExercises({})
                        setPlannedDrafts({})
                        setBlockSelectorOpen(false)
                      }}
                    >
                      <span className="block-selector-option-content">
                        <span className="block-selector-option-heading">
                          {/* TODO(i18n): PT will provide approved translations */}
                          <strong>{block.number === 0 ? block.name : t('workout.block.optionTitle', { number: block.number, name: block.name })}</strong>
                          <span className="origin-badge">{block.origin === 'pt' ? text.pt : text.coach}</span>
                        </span>
                        <small>{`${blockDateRange(block, language)} · ${formatBlockMethod(block.method, language)}`}</small>
                        {/* TODO(i18n): PT will provide approved translations */}
                        <small className="block-selector-option-summary">{block.summary}</small>
                      </span>
                      <small className="block-selector-option-status">{t(blockStatusKey[trainingBlockDateStatus(block, today)])}</small>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {planMode === 'preset' ? (
        <>
        <div className="day-tabs" aria-label={t('workout.day.tabsAria')}>
          {activeBlock?.days.map((day) => (
            <button
              key={day.key}
              type="button"
              className={day.key === (activeDay?.key ?? selectedDay) ? 'day-tab active' : 'day-tab'}
              aria-label={t('workout.day.aria', {
                position: day.position,
                name: day.name,
                today: todayDay?.key === day.key ? ` · ${t('workout.day.today')}` : '',
              })}
              aria-pressed={day.key === (activeDay?.key ?? selectedDay)}
              onClick={() => {
                setSelectedDay(day.key)
                collapseAllExerciseSections()
              }}
            >
              <span className="day-tab-label">{t('workout.day.short', { position: day.position })}</span>
              {(() => {
                const week = weekBounds(localIsoDate())
                const done = day.exercises.filter((item) =>
                  history.some(
                    (entry) =>
                      entry.exerciseId === item.exerciseId &&
                      entry.date >= week.start &&
                      entry.date <= week.end &&
                      entry.blockId === activeBlock.id &&
                      entry.dayKey === day.key
                  )
                ).length
                return (
                  <>
                    <span className="day-tab-progress">{`${done}/${day.exercises.length}`}</span>
                    {todayDay?.key === day.key && <span className="day-tab-today">{t('workout.day.today')}</span>}
                  </>
                )
              })()}
            </button>
          ))}
        </div>
        {activeDay && (
          <>
            {/* TODO(i18n): PT will provide approved translations */}
            <h2 className="selected-day-name">{t('workout.day.title', { position: activeDay.position, name: activeDay.name })}</h2>
          </>
        )}
        {activeDay?.focus && (
          <>
            {/* TODO(i18n): PT will provide approved translations */}
            <p className="day-focus-label">{activeDay.focus}</p>
          </>
        )}
        </>
      ) : (
        <section className="custom-plan-builder">
          <div className="custom-plan-header">
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
                    displayExerciseName(a).localeCompare(displayExerciseName(b), locale)
                  )
                  .map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {displayExerciseName(exercise)}
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
            <div className="custom-plan-list" aria-label={t('workout.custom.listAria')}>
              {customPlan.map((exercise) => (
                <div key={`custom-${exercise.name}`} className="custom-plan-item">
                  <span>{displayExerciseName(exercise.name)}</span>
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

      {activeExercises.length > 0 && (
      <section className="day-plan-card">
        <div className="day-exercises">
          {groupSupersets(activeExercises).map((group) => {
            const previousSetsByExercise = new Map<string, ReturnType<typeof getPreviousWorkoutSets>>()
            const cards = group.items.map(({ exercise, exerciseIndex }) => {
            const draft = getDraftForExercise(exercise.name, exercise)
            const trainer = getTrainerRecommendation(exercise)
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
            const libraryMatch =
              exerciseCatalog.find((item) => item.id === exercise.exerciseId) ??
              exerciseCatalog.find((item) => normalizeExerciseName(item.name) === exerciseKey)
            const displayName =
              language === 'es' && libraryMatch?.nameEs?.trim() ? libraryMatch.nameEs : displayExerciseName(exercise.name)
            const displayTitle = splitExerciseTitle(displayName)
            const originalExercise = exercise.swappedFrom
              ? exerciseCatalog.find((item) => item.id === exercise.swappedFrom)
              : undefined
            const exerciseHistory = history
              .filter((entry) => {
                if (exercise.exerciseId) return entry.exerciseId === exercise.exerciseId
                const match = exerciseCatalog.find((item) => item.id === entry.exerciseId)
                return match && normalizeExerciseName(match.name) === exerciseKey
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            const previousSelection = exercise.exerciseId
              ? findPrefillSelection(history, exercise.exerciseId, planMode === 'preset' ? activeDay?.key : undefined)
              : undefined
            const previousEntry = previousSelection?.entry ?? (exercise.exerciseId ? undefined : exerciseHistory[0])
            const previousSets = previousEntry?.sets ?? []
            const previousDayType = previousSelection?.basis === 'other-day'
              ? getDayKeyType(previousEntry?.dayKey)
              : undefined
            previousSetsByExercise.set(exercise.code ?? exercise.name, previousSets)
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
            const benchAngleLabel = formatBenchAngle(exercise.angleDegrees, language)
            const isCollapsed = !!collapsedExercises[exerciseKey]
            const isProgressSectionVisible = progressSectionsVisible[exerciseKey] ?? false
            const isTipsVisible = postureTipsVisible[exerciseKey] ?? false
            const postureTips = getPostureTips(exercise, libraryMatch)
            const completedEntry = findExerciseCompletion(exercise, history)
            const recordBadges =
              completedEntry?.date === today
                ? personalRecordBadgesByEntryId.get(completedEntry.id) ?? []
                : []
            const toastRecommendation = toast?.recommendations.find(
              (recommendation) => recommendation.exerciseKey === exerciseKey
            )
            // Preset plans: the "Next" box comes from the AI Trainer engine (next occurrence), not the old rule.
            const trainerNext = planMode === 'preset' && completedEntry
              ? buildWorkoutSummary([completedEntry], history, trainingBlocks, exerciseCatalog, today)[0]
              : undefined
            const insightTarget = planMode === 'preset'
              ? null
              : completedEntry
                ? getNextTarget(exercise, completedEntry.sets)
                : toastRecommendation?.target
            const completedRows = Array.from(
              { length: setCount },
              (_, index) => draft.setDone[index] ?? false
            )
            const completedSetCount = completedRows.filter(Boolean).length
            const completedSetsForHint = completedRows
              .flatMap((complete, index) => complete ? [{
                weight: setWeights[index] ?? draft.weight,
                reps: setReps[index] ?? draft.reps,
                at: draft.setAt?.[index] ?? index,
              }] : [])
              .sort((a, b) => a.at - b.at)
            const prescribedHintReps = (exercise.repsPerSet ?? [exercise.reps ?? '8'])
              .map((rep) => parseRepPrescription(rep)[0])
              .filter((reps) => reps > 0)
            const fallbackHintTarget = prescribedHintReps.length
              ? { min: Math.min(...prescribedHintReps), max: Math.max(...prescribedHintReps) }
              : { min: 8, max: 8 }
            const hintTarget = trainer
              ? draft.trainerChoice === 'accepted' ? trainer.recommendation.reps : trainer.target
              : fallbackHintTarget
            const nextUncheckedIndex = completedRows.findIndex((complete) => !complete)
            const setHint = !group.isSuperset && exercise.technique === 'straight' && nextUncheckedIndex >= 0
              ? nextSetHint({
                  target: hintTarget,
                  plannedWeight: setWeights[nextUncheckedIndex] ?? draft.weight,
                  completedSets: completedSetsForHint,
                  step: equipmentStep(libraryMatch?.equipment),
                })
              : null
            const setHintDismissalKey = `${getPlanDraftKey(exercise.name)}:${nextUncheckedIndex}`
            const finalLoggedSet = completedEntry?.sets[completedEntry.sets.length - 1]
            const shouldAskRir = completedEntry?.date === today &&
              !!finalLoggedSet &&
              finalLoggedSet.rir === undefined &&
              !dismissedRirEntries[completedEntry.id]
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
                <div
                  className="planned-exercise-header"
                  onClick={() => toggleExerciseCollapse(exercise.name)}
                >
                  <span className="planned-exercise-title-block">
                    {exercise.code && <span className="plan-exercise-code">{exercise.code}</span>}
                    <span className="planned-exercise-name-row">
                      <span className="planned-exercise-name-wrap">
                        <a
                          className="planned-exercise-main-name exercise-image-link"
                          href={exerciseImageSearchUrl(exerciseImageQuery(libraryMatch?.id ?? exercise.exerciseId, displayName, libraryMatch?.equipment))}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t('workout.exercise.imageSearch', { name: displayName })}
                          onClick={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            void openExternal(event.currentTarget.href)
                          }}
                        >
                          <NameWithArrow name={displayTitle.main} />
                        </a>
                        {displayTitle.details ? <span className="planned-exercise-detail-name">{displayTitle.details}</span> : null}
                      </span>
                      {planMode === 'preset' && libraryMatch && completedEntry?.date !== today && (
                        <ExerciseSwapButton
                          label={t('workout.swap.change')}
                          onClick={() => {
                            setSwapTarget({
                              exercise: libraryMatch,
                              fromExerciseId: exercise.swappedFrom ?? exercise.exerciseId!,
                            })
                          }}
                        />
                      )}
                    </span>
                    {exercise.swappedFrom && (
                      <small className="exercise-swap-origin">
                        {t('workout.swap.insteadOf', {
                          name: displayExerciseName(originalExercise ?? exercise.swappedFrom),
                        })}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            undoExerciseSwap(exercise.swappedFrom!)
                          }}
                        >
                          {t('workout.action.undo')}
                        </button>
                      </small>
                    )}
                      {completedEntry && (
                        <span className="done-badge" role="status">
                          <span aria-hidden="true">✓ </span>
                          {t('workout.status.done')}
                          {loggedAtByExercise[completedEntry.id] ? ` · ${formatLoggedTime(loggedAtByExercise[completedEntry.id], language)}` : ''}
                          <span className="done-summary"> · {summarizeCompletedEntry(completedEntry, language)}</span>
                        </span>
                      )}
                      {recordBadges.map((badge) => (
                        <span key={`${completedEntry?.id}-${badge}`} className="personal-record-badge">
                          {badge === 'e1rm' ? t('workout.pr.e1rm') : badge === 'weight' ? t('workout.pr.weight') : t('workout.pr.reps')}
                        </span>
                      ))}
                  </span>
                  <button
                    type="button"
                    className="toggle-button expand-toggle"
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed
                      ? t('workout.exercise.expand', { name: displayName })
                      : t('workout.exercise.collapse', { name: displayName })}
                    
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleExerciseCollapse(exercise.name)
                    }}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                </div>

                {trainerNext && (
                  <aside className="next-target-card">
                    <strong>{t('workout.session.performanceNext', {
                      day: trainerNext.nextDate ? formatWeekdayDate(language, `${trainerNext.nextDate}T00:00:00Z`).split(' ')[0] : '',
                      weight: formatNumber(language, trainerNext.next.weight ?? trainerNext.actual.weight),
                      reps: trainerRangeLabel(trainerNext.next.reps),
                    })}</strong>
                    <p>{trainerReason(t, language, trainerNext.next, trainerNext.target.reps)}</p>
                  </aside>
                )}
                {insightTarget && (toastRecommendation || completedEntry) && (
                  <aside className="next-target-card" role="status" aria-live="polite">
                    <strong>{getNextTargetLabel(insightTarget)}</strong>
                    <p>{getNextTargetWhy(insightTarget)}</p>
                  </aside>
                )}
                {shouldAskRir && completedEntry && (
                  <div className="trainer-rir-prompt" role="group" aria-label={t('workout.rir.question')}>
                    <span>{t('workout.rir.question')}</span>
                    <div className="trainer-rir-options">
                      {[
                        { label: 'workout.rir.zero', value: 0 },
                        { label: 'workout.rir.oneTwo', value: 2 },
                        { label: 'workout.rir.threePlus', value: 3 },
                      ].map(({ label, value }) => (
                        <button key={value} type="button" onClick={() => saveSetRir(completedEntry, value)}>
                          {t(label as TranslationKey)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="trainer-rir-skip"
                        onClick={() => setDismissedRirEntries((current) => ({ ...current, [completedEntry.id]: true }))}
                      >
                        {t('workout.rir.skip')}
                      </button>
                    </div>
                  </div>
                )}

                {!isCollapsed && (
                  <>
                    <div className="chip-row chip-row-tight">
                      {exercise.technique && <span className="chip technique-chip">{formatTechniqueLabel(exercise.technique, t)}</span>}
                      {benchAngleLabel && <span className="chip subtle">{benchAngleLabel}</span>}
                      {muscleChips.map((muscle, index) => (
                        <span key={`${exerciseKey}-muscle-${index}`} className={index === 0 ? 'chip' : 'chip subtle'}>
                          {localizeMuscle(muscle, language)}
                        </span>
                      ))}
                    </div>
                    <p className="planned-meta-line">
                      {`${setLabel(setCount)} · ${exercise.repsPerSet?.join('·') ?? exercise.reps ?? '—'} ${t('workout.label.repsInline')} · ${exercise.rest} ${t('workout.label.restInline')}`}
                    </p>
                    {!completedEntry && trainer && (
                      <TrainerRecommendationCard
                        title={t('workout.trainer.title')}
                        lastTime={trainer.evidence[0]
                          ? new Set(trainer.evidence[0].sets.map((set) => set.weight)).size > 1
                            // Different loads per set (e.g. 20 / 22.5 / 22.5): show each set, not only the first.
                            ? t('workout.trainer.lastTimeSets', {
                                sets: trainer.evidence[0].sets
                                  .map((set) => `${formatNumber(language, set.weight)} × ${formatNumber(language, set.reps)}`)
                                  .join(' · '),
                              })
                            : t('workout.trainer.lastTime', {
                                weight: formatNumber(language, trainer.evidence[0].sets[0]?.weight ?? 0),
                                reps: trainer.evidence[0].sets.map((set) => formatNumber(language, set.reps)).join(' · '),
                              })
                          : t('workout.trainer.noPrevious')}
                        original={new Set(trainer.original.setWeights).size > 1
                          ? t('workout.trainer.originalSets', {
                              weights: trainer.original.setWeights.map((weight) => formatNumber(language, weight)).join(' / '),
                              reps: trainerRangeLabel(trainer.target),
                            })
                          : t('workout.trainer.original', {
                              weight: formatNumber(language, trainer.original.weight),
                              reps: trainerRangeLabel(trainer.target),
                            })}
                        recommended={t('workout.trainer.recommended', {
                          weight: trainer.recommendation.setWeights && new Set(trainer.recommendation.setWeights).size > 1
                            ? trainer.recommendation.setWeights.map((weight) => formatNumber(language, weight)).join(' / ')
                            : formatNumber(language, trainer.recommendation.weight ?? trainer.original.weight),
                          reps: trainer.recommendation.setReps
                            ? trainer.recommendation.setReps.map((reps) => formatNumber(language, reps)).join(' · ')
                            : trainerRangeLabel(trainer.recommendation.reps),
                        })}
                        why={t('workout.trainer.why', {
                          reason: trainerWhy(
                            exercise.exerciseId,
                            trainer.recommendation,
                            { weight: trainer.original.weight, target: trainer.target },
                            trainerReason(t, language, trainer.recommendation, trainer.target)
                          ) + (trainer.recommendation.calibration
                            ? ' ' + t(
                                trainer.recommendation.calibration.offset > 0
                                  ? 'workout.trainer.calibration.up'
                                  : 'workout.trainer.calibration.down',
                                {
                                  reps: formatNumber(language, Math.abs(trainer.recommendation.calibration.offset)),
                                  delta: formatNumber(language, Math.abs((trainer.recommendation.weight ?? 0) - trainer.recommendation.calibration.uncalibratedWeight)),
                                }
                              ) + (trainer.recommendation.calibration.capped ? ' ' + t('workout.trainer.calibration.capped') : '')
                            : ''),
                        })}
                        confidence={t(`workout.trainer.confidence.${trainer.recommendation.confidence}` as TranslationKey)}
                        collectData={trainer.recommendation.action === 'collect_data'}
                        sameAsOriginal={
                          !(trainer.recommendation.setWeights && new Set(trainer.recommendation.setWeights).size > 1) &&
                          trainer.recommendation.weight === trainer.original.weight &&
                          trainer.recommendation.reps.min === trainer.target.min &&
                          trainer.recommendation.reps.max === trainer.target.max &&
                          trainer.recommendation.sets === setCount
                        }
                        choiceText={draft.trainerChoice
                          ? t(draft.trainerChoice === 'accepted'
                            ? 'workout.trainer.choice.accepted'
                            : 'workout.trainer.choice.keptOriginal', {
                              weight: formatNumber(language, draft.weight),
                              reps: trainerRangeLabel(draft.trainerChoice === 'accepted'
                                ? trainer.recommendation.reps
                                : trainer.target),
                            })
                          : undefined}
                        acceptLabel={t('workout.trainer.accept')}
                        keepOriginalLabel={t('workout.trainer.keepOriginal')}
                        collectDataText={t('workout.trainer.collectData')}
                        sameAsOriginalText={t('workout.trainer.sameAsOriginal', {
                          weight: formatNumber(language, trainer.recommendation.weight ?? trainer.original.weight),
                          reps: trainerRangeLabel(trainer.recommendation.reps),
                        })}
                        onAccept={() => saveTrainerChoice(exercise, 'accepted', trainer)}
                        onKeepOriginal={() => saveTrainerChoice(exercise, 'kept_original', trainer)}
                      />
                    )}
                    {/* TODO(i18n): PT will provide approved translations */}
                    {exercise.weekNote && (
                      <p className="planned-exercise-notes">
                        {t(activeBlockWeek === 6 ? 'workout.weekNote.deload' : 'workout.weekNote.intro')}
                      </p>
                    )}
                    {exercise.notes?.trim() && exercise.notes !== exercise.weekNote && (
                      <p className="planned-exercise-notes">{exercise.notes}</p>
                    )}

                    <SqueezeCue
                      cue={libraryMatch?.squeezeCue}
                      cueLabel={t('workout.squeezeCue')}
                      tips={postureTips}
                      tipsLabel={text.posture}
                      tipsId={`posture-tips-${exerciseKey}`}
                      expanded={isTipsVisible}
                      onToggle={() => togglePostureTips(exercise.name)}
                    />

                    {!group.isSuperset && (
                      <div className="planned-set-section">
                        <div className="planned-set-header">
                          <div className="planned-set-actions">
                            <button
                              type="button"
                              className="same-as-set-one-button"
                              disabled={!(Number(setWeights[0]) > 0)}
                              onClick={() => copyPlanSetOneWeight(exercise, setCount)}
                            >
                              {t('workout.set.sameAsFirst')}
                            </button>
                            <button
                              type="button"
                              className="rest-start-button"
                              onClick={() => onStartRest(exercise.restSeconds ?? 90, displayExerciseName(exercise.name))}
                            >
                              {t('workout.action.startRest')}
                            </button>
                          </div>
                        </div>

                        <div className="planned-set-grid">
                          <div className="planned-set-column-headers" aria-hidden="true">
                            <span>{t('workout.label.set')}</span>
                            <span>
                              {t('workout.label.previous')}
                              {previousDayType && (
                                <small className="previous-day-label">{t('workout.previous.day', { day: previousDayType })}</small>
                              )}
                            </span>
                            <span>kg</span>
                            <span>{text.repsShort}</span>
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
                                    aria-label={t('workout.set.copyPrevious', {
                                      set: index + 1,
                                      weight: previousSet.weight,
                                      reps: previousSet.reps,
                                    })}
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
                                  label={t('workout.set.weightLabel', { set: index + 1 })}
                                  decreaseLabel={t('workout.set.weightDecrease', { set: index + 1 })}
                                  increaseLabel={t('workout.set.weightIncrease', { set: index + 1 })}
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
                                  aria-label={t('workout.set.repsLabel', { set: index + 1 })}
                                  onChange={(event) => updatePlanSetValue(exercise, index, 'reps', event.target.value, setCount)}
                                />
                                <button
                                  type="button"
                                  className="complete-set-button"
                                  aria-label={t(
                                    completedRows[index] ? 'workout.set.complete.unmark' : 'workout.set.complete.mark',
                                    { set: index + 1 }
                                  )}
                                  aria-pressed={completedRows[index]}
                                  onClick={() => {
                                    if (!completedRows[index]) onStartRest(exercise.restSeconds ?? 90, displayExerciseName(exercise.name))
                                    togglePlanSetDone(exercise, index, setCount)
                                  }}
                                >
                                  ✓
                                </button>
                                {setHint &&
                                  index === nextUncheckedIndex &&
                                  !dismissedSetHints[setHintDismissalKey] && (
                                    <div className="trainer-set-hint" role="status">
                                      <span>
                                        {t('workout.setHint.message', {
                                          reps: formatNumber(language, completedSetsForHint[completedSetsForHint.length - 1]?.reps ?? 0),
                                          weight: formatNumber(language, completedSetsForHint[completedSetsForHint.length - 1]?.weight ?? 0),
                                          suggestedWeight: formatNumber(language, setHint.weight),
                                        })}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          useSetHint(exercise, setCount, setHint.weight)
                                          setDismissedSetHints((current) => ({ ...current, [setHintDismissalKey]: true }))
                                        }}
                                      >
                                        {t('workout.setHint.use', { weight: formatNumber(language, setHint.weight) })}
                                      </button>
                                      <button
                                        type="button"
                                        className="trainer-set-hint-dismiss"
                                        aria-label={t('workout.setHint.dismiss')}
                                        onClick={() => setDismissedSetHints((current) => ({ ...current, [setHintDismissalKey]: true }))}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )}
                                {exercise.technique === 'drop-set' && (
                                  <div className="planned-drop-set-row">
                                    <strong>{t('workout.technique.drop')}</strong>
                                    <SteppedNumberInput
                                      value={dropSetWeights[index] ?? 0}
                                      step={2.5}
                                      min={0}
                                      label={t('workout.set.dropWeightLabel', { set: index + 1 })}
                                      decreaseLabel={t('workout.set.dropWeightDecrease', { set: index + 1 })}
                                      increaseLabel={t('workout.set.dropWeightIncrease', { set: index + 1 })}
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
                                      aria-label={t('workout.set.dropRepsLabel', { set: index + 1 })}
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
                            {t('workout.action.logExercise')}
                          </button>
                        )}
                      </div>
                    )}

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
                                <span>{formatHistoryDate(language, item.date)}</span>
                                <strong>{formatNumber(language, item.maxWeight)} kg</strong>
                              </div>
                              <div className="planned-history-meta">
                                <small>{t('workout.volume.value', { value: formatNumber(language, item.totalVolume) })}</small>
                                <small>{setLabel(item.setsCount)}</small>
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
                    {!group.isSuperset && (
                      <label className="planned-notes-field">
                        <span>{t('workout.label.notes')}</span>
                        <textarea
                          rows={2}
                          value={draft.notes}
                          placeholder={t('workout.notes.placeholderExercise')}
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
            const supersetPreviousSets = supersetExercises.map(
              (exercise) => previousSetsByExercise.get(exercise.code ?? exercise.name) ?? []
            )
            const supersetSetCount = Math.max(...supersetExercises.map(getDefaultSetCount))
            const loggedSupersetRows = getLoggedSupersetRounds(
              supersetExercises.map((exercise) => findExerciseCompletion(exercise, history)?.sets.length ?? 0),
              supersetSetCount
            )
            const supersetCompletedRows = completedSupersetSets[group.key] ?? loggedSupersetRows
            const supersetCompletedTimes = completedSupersetAt[group.key] ?? []
            const supersetCompletedCount = supersetCompletedRows.filter(Boolean).length
            const supersetError = supersetExercises
              .map((exercise) => logError[getPlanDraftKey(exercise.name)])
              .find(Boolean)
            return (
              <div key={group.key} className={groupDone ? 'superset-group completed' : 'superset-group'}>
                <div className="superset-group-header">
                  <span className="chip technique-chip">{t('workout.technique.superset')}</span>
                  {groupDone && <span className="done-badge" role="status"><span aria-hidden="true">✓ </span>{t('workout.status.done')}</span>}
                  <p>{t('workout.superset.instructions', { first: codes[0], others: codes.slice(1).join(', ') })}</p>
                </div>
                {cards}
                <div className={`superset-log-box${supersetLogOpen[group.key] ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="rest-start-button"
                    onClick={() =>
                      onStartRest(
                        supersetExercises[supersetExercises.length - 1]?.restSeconds ?? 90,
                        supersetExercises.map((item) => displayExerciseName(item.name)).join(' + ')
                      )
                    }
                  >
                    {t('workout.action.startRest')}
                  </button>
                  <button
                    type="button"
                    className="superset-log-toggle"
                    aria-expanded={!!supersetLogOpen[group.key]}
                    aria-controls={`superset-log-${group.key}`}
                    onClick={() => setSupersetLogOpen((current) => ({ ...current, [group.key]: !current[group.key] }))}
                  >
                    <span className="superset-log-title">{t('workout.superset.logRounds')}</span>
                    <span className="superset-log-progress">{`${supersetCompletedCount}/${supersetSetCount} ${roundWord(supersetSetCount).toLowerCase()}`}</span>
                    <span className="toggle-button expand-toggle" aria-hidden="true">
                      {supersetLogOpen[group.key] ? '−' : '+'}
                    </span>
                  </button>
                  {supersetLogOpen[group.key] && (
                    <div id={`superset-log-${group.key}`} className="superset-log-body">
                      <button
                        type="button"
                        className="same-as-set-one-button"
                        disabled={!supersetExercises.some(
                          (exercise) => (getDraftForExercise(exercise.name, exercise).setWeights[0] ?? 0) > 0
                        )}
                        onClick={() => supersetExercises.forEach((exercise) => copyPlanSetOneWeight(exercise, supersetSetCount))}
                      >
                        {t('workout.superset.copyRoundOne')}
                      </button>
                      <div className="superset-round-columns" aria-hidden="true">
                        <span />
                        <span>{t('workout.label.previous')}</span>
                        <span>kg</span>
                        <span>{text.repsShort}</span>
                      </div>
                      {Array.from({ length: supersetSetCount }, (_, setIndex) => (
                        <div
                          className={`superset-round${supersetCompletedRows[setIndex] ? ' completed' : ''}`}
                          key={`${group.key}-set-${setIndex + 1}`}
                        >
                          <div className="superset-round-header">
                            <span className="superset-round-label">{t('workout.round.label', { count: setIndex + 1 })}</span>
                            <button
                              type="button"
                              className="complete-set-button"
                              aria-label={t(
                                supersetCompletedRows[setIndex]
                                  ? 'workout.superset.complete.unmark'
                                  : 'workout.superset.complete.mark',
                                { set: setIndex + 1 }
                              )}
                              aria-pressed={supersetCompletedRows[setIndex]}
                              onClick={() => {
                                const nextCompleted = [...supersetCompletedRows]
                                const nextCompletedAt = Array.from(
                                  { length: supersetSetCount },
                                  (_, index) => supersetCompletedTimes[index]
                                )
                                nextCompleted[setIndex] = !nextCompleted[setIndex]
                                nextCompletedAt[setIndex] = nextCompleted[setIndex] ? Date.now() : undefined
                                setCompletedSupersetSets((current) => ({ ...current, [group.key]: nextCompleted }))
                                setCompletedSupersetAt((current) => ({ ...current, [group.key]: nextCompletedAt }))
                                // Rest is taken after the pair, using the last exercise's prescribed rest.
                                if (nextCompleted[setIndex]) {
                                  onStartRest(
                                    supersetExercises[supersetExercises.length - 1]?.restSeconds ?? 90,
                                    supersetExercises.map((item) => displayExerciseName(item.name)).join(' + ')
                                  )
                                }
                                if (nextCompleted.every(Boolean)) {
                                  void logSuperset(supersetExercises, group.key, nextCompleted, nextCompletedAt)
                                }
                              }}
                            >
                              ✓
                            </button>
                          </div>
                          {supersetExercises.map((exercise, exerciseIndex) => {
                            const draft = getDraftForExercise(exercise.name, exercise)
                            const code = exercise.code ?? exercise.name
                            const previousSet = getPreviousWorkoutSetRow(supersetPreviousSets, setIndex)[exerciseIndex]
                            const prescribedReps = exercise.repsPerSet?.[setIndex] ?? exercise.reps ?? ''
                            const reps =
                              draft.setReps[setIndex] ??
                              parseRepPrescription(prescribedReps)[0] ??
                              getDefaultRepTarget(exercise)
                            const weight = draft.setWeights[setIndex] ?? draft.weight ?? 0
                            return (
                              <div className="superset-round-row" key={`${group.key}-${code}`}>
                                <span className="superset-round-code" title={displayExerciseName(exercise.name)}>{code}</span>
                                {previousSet ? (
                                  <button
                                    type="button"
                                    className="previous-set-value"
                                    aria-label={t('workout.superset.copyPrevious', {
                                      code,
                                      set: setIndex + 1,
                                      weight: previousSet.weight,
                                      reps: previousSet.reps,
                                    })}
                                    onClick={() => {
                                      updatePlanSetValue(exercise, setIndex, 'weight', String(previousSet.weight), supersetSetCount)
                                      updatePlanSetValue(exercise, setIndex, 'reps', String(previousSet.reps), supersetSetCount)
                                    }}
                                  >
                                    {previousSet.weight}×{previousSet.reps}
                                  </button>
                                ) : (
                                  <span className="previous-set-value">—</span>
                                )}
                                <SteppedNumberInput
                                  value={weight}
                                  step={2.5}
                                  min={0}
                                  label={t('workout.superset.weightLabel', { set: setIndex + 1, code })}
                                  decreaseLabel={t('workout.superset.weightDecrease', { set: setIndex + 1, code })}
                                  increaseLabel={t('workout.superset.weightIncrease', { set: setIndex + 1, code })}
                                  onFocus={(event) => event.currentTarget.select()}
                                  onClick={(event) => event.currentTarget.select()}
                                  onChange={(value) => updatePlanSetValue(exercise, setIndex, 'weight', value, supersetSetCount)}
                                />
                                <input
                                  className="set-reps-input"
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  value={reps}
                                  aria-label={t('workout.superset.repsLabel', { set: setIndex + 1, code })}
                                  onChange={(event) =>
                                    updatePlanSetValue(exercise, setIndex, 'reps', event.target.value, supersetSetCount)
                                  }
                                />
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      <details className="superset-notes">
                        <summary>{t('workout.label.notes')}</summary>
                        {supersetExercises.map((exercise) => {
                          const draft = getDraftForExercise(exercise.name, exercise)
                          return (
                            <label className="planned-notes-field" key={`${group.key}-${exercise.code}-notes`}>
                              <span>{exercise.code ?? exercise.name} · {displayExerciseName(exercise.name)}</span>
                              <textarea
                                rows={2}
                                value={draft.notes}
                                placeholder={t('workout.notes.placeholder')}
                                onChange={(event) => updatePlanDraft(exercise, 'notes', event.target.value)}
                              />
                            </label>
                          )
                        })}
                      </details>
                      {supersetError && <p role="alert" aria-live="assertive" className="account-error log-error">{supersetError}</p>}
                      {(supersetCompletedCount < supersetSetCount || supersetError) && (
                        <button
                          type="button"
                          className="primary-button small-button"
                          onClick={() => void logSuperset(supersetExercises, group.key, supersetCompletedRows, supersetCompletedTimes)}
                        >
                          {t('workout.superset.finish')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      )}
      {swapTarget && (
        <div className="exercise-swap-backdrop" role="presentation" onClick={() => setSwapTarget(null)}>
          <ExerciseSwapSheet
            alternatives={swapSuggestions}
            language={language}
            t={t}
            onCancel={() => setSwapTarget(null)}
            onSelect={chooseExerciseSwap}
          />
        </div>
      )}
      {sessionSummary && (
        <div className="session-summary-backdrop" onClick={dismissSessionSummary}>
          <section
            className="session-summary-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-summary-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="session-summary-header">
              <h2 id="session-summary-title">{t('workout.session.performance')}</h2>
              <button
                type="button"
                className="session-summary-close"
                onClick={dismissSessionSummary}
                aria-label={t('workout.session.close')}
              >
                ×
              </button>
            </header>
            <div className="session-summary-metrics">
              <div><strong>{sessionSummary.duration}</strong><span>{t('workout.session.duration')}</span></div>
              <div><strong>{sessionSummary.sets}</strong><span>{text.sets}</span></div>
              <div><strong>{formatNumber(language, sessionSummary.volume)} kg</strong><span>{t('workout.session.volume')}</span></div>
            </div>
            <section className="session-summary-records" aria-label={t('workout.session.records')}>
              <h3>{t('workout.session.records')}</h3>
              {sessionSummary.prs.length > 0 ? (
                <ul>
                  {sessionSummary.prs.map(({ exerciseId, badges }) => {
                    const exercise = exerciseCatalog.find((item) => item.id === exerciseId)
                    const exerciseName = exercise ? displayExerciseName(exercise) : exerciseId
                    const labels = badges.map((badge) =>
                      badge === 'e1rm' ? t('workout.pr.e1rm') : badge === 'weight' ? t('workout.pr.weight') : t('workout.pr.reps')
                    )
                    return <li key={exerciseId}>{exerciseName} · {labels.join(', ')}</li>
                  })}
                </ul>
              ) : (
                <p>{t('workout.session.noRecords')}</p>
              )}
            </section>
            {sessionSummary.performance.length > 0 && (
              <section className="session-summary-targets" aria-label={t('workout.session.performance')}>
                <h3>{t('workout.session.performance')}</h3>
                <ul>
                  {sessionSummary.performance.map((row) => {
                    const { exerciseId, trend, actual, target, next, nextDate } = row
                    const exercise = exerciseCatalog.find((item) => item.id === exerciseId)
                    const template = trainerReason(t, language, next, target.reps)
                    const why = trainerWhy(
                      exerciseId,
                      next,
                      { weight: target.weight ?? actual.weight, target: target.reps },
                      template
                    )
                    return (
                      <li key={exerciseId}>
                        <strong>
                          {exercise ? displayExerciseName(exercise) : exerciseId}{' '}
                          <span aria-label={t(`workout.session.trend.${trend}` as TranslationKey)}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                          </span>
                        </strong>
                        <p>{t('workout.session.performanceActual', {
                          weight: formatNumber(language, actual.weight),
                          reps: actual.reps.map((reps) => formatNumber(language, reps)).join(' · '),
                          target: trainerRangeLabel(target.reps),
                        })}</p>
                        <p>{t('workout.session.performanceNext', {
                          day: nextDate ? formatWeekdayDate(language, `${nextDate}T00:00:00Z`).split(' ')[0] : '',
                          weight: formatNumber(language, next.weight ?? actual.weight),
                          reps: trainerRangeLabel(next.reps),
                        })}</p>
                        <p>{t('workout.session.performanceWhy', { reason: why })}</p>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
            {sessionSummary.nextSession && <p className="session-summary-next">{t('workout.session.next', { session: sessionSummary.nextSession })}</p>}
            {toast && (
              <div className="log-toast in-summary" role="status" aria-live="polite">
                <button type="button" onClick={undoLastLog}>{t('workout.action.undo')}</button>
              </div>
            )}
          </section>
        </div>
      )}
      {toast && !sessionSummary && (
        <div className="log-toast" role="status" aria-live="polite">
          <button type="button" onClick={undoLastLog}>{t('workout.action.undo')}</button>
        </div>
      )}
    </div>
  )
}
