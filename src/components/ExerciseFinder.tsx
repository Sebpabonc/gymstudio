import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AuthStatus } from '../auth/AuthProvider'
import type { Exercise, TrainingBlock, WorkoutEntry, WorkoutSet } from '../types'
import { formatNumber, formatWeekdayDate, localizeMuscle, useT } from '../i18n'
import { shortSqueezeCues } from '../data/shortSqueezeCues'
import { localIsoDate } from '../lib/dates'
import { openExternal } from '../native/openExternal'
import { loadDemoBlocks } from '../plans/demoBlock'
import { activeSwaps, applySwaps, type ExerciseSwap } from '../plans/exerciseSwaps'
import { selectPlanBlocks } from '../plans/selectPlanBlocks'
import { isDemoMode } from '../utils/demoMode'
import { exerciseImageQuery, exerciseImageSearchUrl } from '../utils/exerciseImages'
import { ALL_BODY_REGIONS, equipmentLabel, filterExercises, getAvailableBodyRegions, getExerciseTips } from '../utils/exerciseFilters'
import {
  fetchActiveUserPlan, fetchTrainingBlocks, getActiveBlockId, getCachedActiveUserPlan,
  getCachedTrainingBlocks, getExerciseDisplayName, loadLocalExerciseSwaps,
  saveLocalExerciseSwaps, saveWorkoutHistory,
} from '../utils/storage'
import { defaultActiveBlock, todayTrainingDay } from '../utils/trainingBlocks'
import { filterLoggableSets, getPreviousWorkoutSets } from '../utils/workoutSets'
import ExerciseSearchSuggestions from './ExerciseSearchSuggestions'
import { CueSheet } from './SqueezeCue'
import WorkoutSetInputs from './WorkoutSetInputs'

export function recentExercises(exercises: Exercise[], history: WorkoutEntry[]) {
  const catalogue = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const ids = [...new Set([...history].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => entry.exerciseId))]
  return ids.flatMap((id) => catalogue.get(id) ? [catalogue.get(id)!] : []).slice(0, 5)
}

export function todayPlanExercises(
  blocks: TrainingBlock[], history: WorkoutEntry[], exercises: Exercise[], swaps: ExerciseSwap[],
  today: string, pinnedId?: string | null,
) {
  const swapped = applySwaps(blocks, activeSwaps(swaps, today), new Set(exercises.map((exercise) => exercise.id)))
  const block = swapped.find((item) => item.id === pinnedId) ?? defaultActiveBlock(swapped, today)
  const day = block && todayTrainingDay(block, history, today)
  return (day?.exercises ?? []).flatMap((planned) => {
    const exercise = exercises.find((item) => item.id === planned.exerciseId)
    return exercise ? [{ exercise, fromExerciseId: planned.swappedFrom ?? planned.exerciseId }] : []
  })
}

function createSet(reps = 8, weight = 0): WorkoutSet {
  return { id: crypto.randomUUID(), reps, weight }
}

export default function ExerciseFinder({
  exercises, history, onHistoryChange, onProgress, authStatus, initialExerciseId,
}: {
  exercises: Exercise[]
  history: WorkoutEntry[]
  onHistoryChange: (history: WorkoutEntry[]) => void
  onProgress: (id: string) => void
  authStatus: AuthStatus
  initialExerciseId?: string
}) {
  const { t, language } = useT()
  const demo = isDemoMode()
  const today = localIsoDate()
  const signedIn = authStatus === 'signed-in'
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState(ALL_BODY_REGIONS)
  const [selectedId, setSelectedId] = useState(initialExerciseId ?? '')
  const [view, setView] = useState<'details' | 'log' | 'swap'>('details')
  const [more, setMore] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [setIndex, setSetIndex] = useState(0)
  const [loggedSets, setLoggedSets] = useState<WorkoutSet[]>([])
  const [weightInput, setWeightInput] = useState('')
  const entryId = useRef('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [swaps, setSwaps] = useState(loadLocalExerciseSwaps)
  const [blocks, setBlocks] = useState(() => selectPlanBlocks(
    demo ? [] : getCachedTrainingBlocks() ?? [],
    signedIn ? getCachedActiveUserPlan() : null, signedIn, demo,
  ))
  const [personal, setPersonal] = useState(() => signedIn && !!getCachedActiveUserPlan())
  const selected = exercises.find((exercise) => exercise.id === selectedId)
  const close = useCallback(() => setSelectedId(''), [])

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      demo ? loadDemoBlocks() : fetchTrainingBlocks(),
      signedIn && !demo ? fetchActiveUserPlan().catch(() => getCachedActiveUserPlan()) : Promise.resolve(null),
    ]).then(([globalBlocks, plan]) => {
      if (cancelled) return
      setBlocks(selectPlanBlocks(globalBlocks, plan, signedIn, demo))
      setPersonal(signedIn && !!plan)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [demo, signedIn])

  useEffect(() => {
    const previous = getPreviousWorkoutSets(history, selectedId)
    setSets(previous.length ? previous.map((set) => createSet(set.reps, set.weight)) : [createSet(), createSet()])
    setLoggedSets([])
    setSetIndex(0)
    setWeightInput(formatNumber(language, previous[0]?.weight ?? 0))
    setNotes('')
    setView('details')
    setMore(false)
    setNoteOpen(false)
    setError('')
    entryId.current = ''
    // Prefill once per selection, not again after a set is saved.
  }, [selectedId])

  const plan = useMemo(() => todayPlanExercises(
    blocks, history, exercises, swaps, today, personal ? null : getActiveBlockId(),
  ), [blocks, history, exercises, swaps, today, personal])
  const swapTargets = plan.some((item) => item.exercise.id === selectedId) ? [] : plan
  const recent = useMemo(() => recentExercises(exercises, history), [exercises, history])
  const searching = !!search.trim() || region !== ALL_BODY_REGIONS
  const results = useMemo(() => filterExercises(exercises, search, region), [exercises, search, region])
  const previous = history.filter((entry) => entry.exerciseId === selectedId)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  const currentSet = sets[setIndex]

  const open = (id: string) => {
    setMessage('')
    setSelectedId(id)
  }
  const logSet = () => {
    if (!selected || !currentSet) return
    if (!weightInput.trim() || !Number.isFinite(Number(weightInput.replace(',', '.')))) {
      setError(t('exercises.enterOneSet'))
      return
    }
    const validSets = filterLoggableSets([currentSet], selected.equipment)
    if (!validSets.length) { setError(t('exercises.enterOneSet')); return }
    const completed = [...loggedSets, ...validSets]
    const id = entryId.current || crypto.randomUUID()
    entryId.current = id
    const entry: WorkoutEntry = {
      id, exerciseId: selected.id, date: today, sets: completed, notes: notes.trim() || undefined,
    }
    const nextHistory = [entry, ...history.filter((item) => item.id !== id)]
      .sort((a, b) => b.date.localeCompare(a.date))
    saveWorkoutHistory(nextHistory)
    onHistoryChange(nextHistory)
    setLoggedSets(completed)
    setError('')
    setMessage(t('exercises.logged', { summary: `${completed.length} × ${getExerciseDisplayName(selected, language)}` }))
    const next = sets[setIndex + 1] ?? createSet(currentSet.reps, currentSet.weight)
    if (!sets[setIndex + 1]) setSets((current) => [...current, next])
    setSetIndex((index) => index + 1)
    setWeightInput(formatNumber(language, next.weight))
  }

  const swapIntoPlan = (fromExerciseId: string) => {
    if (!selected) return
    const remaining = loadLocalExerciseSwaps().filter((swap) =>
      swap.fromExerciseId !== fromExerciseId || swap.scope === 'always')
    setSwaps(saveLocalExerciseSwaps([
      ...remaining, { fromExerciseId, toExerciseId: selected.id, scope: 'today', date: today },
    ], today))
    setMessage(t('exercises.swapped'))
    setView('details')
  }

  return (
    <section className="card exercise-finder">
      <div className="find-search-shell">
        <input id="exercise-search" className="search-input" type="search"
          aria-label={t('exercises.searchLabel')} autoComplete="off" enterKeyHint="search"
          placeholder={t('exercises.searchCountPlaceholder', { count: exercises.length })}
          value={search} onChange={(event) => setSearch(event.target.value)} />
        {search && <button type="button" className="cue-sheet-close" aria-label={t('exercises.clear')} onClick={() => setSearch('')}>×</button>}
      </div>
      <div className="region-chips" role="group" aria-label={t('exercises.bodyRegion')}>
        {getAvailableBodyRegions(exercises).map((item) => (
          <button type="button" key={item} className={`region-chip${region === item ? ' active' : ''}`}
            aria-pressed={region === item} onClick={() => setRegion(item)}>
            {t(`region.${item}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>
      {searching ? (
        <section>
          <h2 className="find-list-heading">{t('exercises.results')} · {results.length}</h2>
          <ExerciseSearchSuggestions exercises={results} onSelect={open} query={search} />
        </section>
      ) : (
        <>
          <section>
            <h2 className="find-list-heading">{t('exercises.inPlan')}</h2>
            {plan.length > 0
              ? <ExerciseSearchSuggestions exercises={plan.map((item) => item.exercise)} onSelect={open} />
              : <p className="empty-state">{t('noPlan.title')}</p>}
          </section>
          <section>
            <h2 className="find-list-heading">{t('exercises.recent')}</h2>
            {recent.length > 0
              ? <ExerciseSearchSuggestions exercises={recent} onSelect={open} />
              : <p className="empty-state">{t('exercises.never')}</p>}
          </section>
        </>
      )}
      {message && <p role="status">{message}</p>}
      {selected && (
        <CueSheet id="find-exercise" onClose={close} sections={[]}
          details={{ title: view === 'swap' ? t('exercises.swapTitle') : getExerciseDisplayName(selected, language), closeLabel: t('exercises.close'), openLabel: '', sections: [] }}>
          <div className="find-exercise-content">
            {view === 'swap' ? (
              <>
                <p>{t('exercises.swapHint')}</p>
                <ExerciseSearchSuggestions exercises={swapTargets.map((item) => item.exercise)}
                  onSelect={(id) => {
                    const target = plan.find((item) => item.exercise.id === id)
                    if (target) swapIntoPlan(target.fromExerciseId)
                  }} />
              </>
            ) : view === 'log' && currentSet ? (
              <>
                <p>{t('workout.run.currentSet', { set: setIndex + 1, total: Math.max(sets.length, setIndex + 1), weight: formatNumber(language, currentSet.weight), reps: currentSet.reps })}</p>
                <WorkoutSetInputs
                  setIndex={setIndex} weight={currentSet.weight} reps={currentSet.reps}
                  weightInput={weightInput} equipment={selected.equipment}
                  language={language} t={t} repsLabel={t('setTable.reps')}
                  onWeightInputChange={setWeightInput}
                  onValueChange={(field, value) => setSets((current) => current.map((set, index) =>
                    index === setIndex ? { ...set, [field]: Number(value) || 0 } : set))}
                />
                {error && <p role="alert">{error}</p>}
                <button type="button" className="primary-button workout-mode-log-set" onClick={logSet}>
                  {t('workout.run.logSet', { set: setIndex + 1 })}
                </button>
                <button type="button" className="secondary-button" onClick={close}>{t('exercises.finish')}</button>
                {message && <p role="status">{message}</p>}
              </>
            ) : (
              <>
                <ExerciseDetails exercise={selected} previous={previous} />
                <button type="button" className="primary-button" onClick={() => setView('log')}>{t('exercises.logIt')}</button>
                <div className="find-secondary-actions">
                  <button type="button" className="secondary-button" aria-disabled="true"
                    onClick={() => setMessage(t('exercises.addTodayUnavailable'))}>{t('exercises.addToday')}</button>
                  <button type="button" className="secondary-button" disabled={!swapTargets.length}
                    onClick={() => setView('swap')}>{t('exercises.swap')}</button>
                </div>
                {message && <p role="status">{message}</p>}
                <button type="button" className="text-button find-more" aria-expanded={more} onClick={() => setMore(!more)}>⋯ {t('exercises.more')}</button>
                {more && (
                  <div className="find-more-actions">
                    <details><summary>{t('exercises.moreTech')}</summary>
                      <ul>{getExerciseTips(selected).map((tip, index) => <li key={index}>{typeof tip === 'string' ? tip : tip.text}</li>)}</ul>
                      {selected.notes && <p>{selected.notes}</p>}
                    </details>
                    <button type="button" className="text-button" onClick={() => void openExternal(exerciseImageSearchUrl(
                      exerciseImageQuery(selected.id, getExerciseDisplayName(selected), selected.equipment),
                    ))}>{t('exercises.moreGoogle')}</button>
                    <button type="button" className="text-button" onClick={() => onProgress(selected.id)}>{t('exercises.moreProg')}</button>
                    <button type="button" className="text-button" onClick={() => setNoteOpen(!noteOpen)}>{t('exercises.moreNotes')}</button>
                    {noteOpen && (
                      <label className="field-label">{t('exercises.notes')}
                        <textarea className="notes-input" value={notes} onChange={(event) => setNotes(event.target.value)} />
                      </label>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CueSheet>
      )}
    </section>
  )
}

export function ExerciseDetails({ exercise, previous }: { exercise: Exercise; previous?: WorkoutEntry }) {
  const { t, language } = useT()
  const primary = exercise.primaryMuscles?.[0] ?? exercise.primaryMuscle
  const also = [...(exercise.primaryMuscles?.slice(1) ?? []), ...(exercise.secondaryMuscles ?? (exercise.secondaryMuscle ? [exercise.secondaryMuscle] : []))]
    .filter((muscle, index, muscles) => muscle !== primary && muscles.indexOf(muscle) === index)
  const cue = shortSqueezeCues[exercise.id as keyof typeof shortSqueezeCues]?.[language] ?? exercise.squeezeCue
  const best = previous?.sets.reduce<WorkoutSet | undefined>((best, set) =>
    !best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps) ? set : best, undefined)
  return (
    <>
      <p className="result-meta">
        {localizeMuscle(primary, language)}
        {also.length > 0 ? ` · ${t('exercises.also')} ${also.map((muscle) => localizeMuscle(muscle, language)).join(', ')}` : ''}
        {exercise.equipment ? ` · ${equipmentLabel(exercise.equipment, language)}` : ''}
      </p>
      {cue && <p className="workout-short-cue"><strong>{t('workout.squeezeCue')} · </strong>{cue}</p>}
      <p className="find-last-time"><span>{t('exercises.lastTime')}</span>
        {best && previous
          ? <strong>{formatNumber(language, best.weight)} kg × {formatNumber(language, best.reps)} · {formatWeekdayDate(language, `${previous.date.slice(0, 10)}T12:00:00`)}</strong>
          : <span>{t('exercises.never')}</span>}
      </p>
    </>
  )
}
