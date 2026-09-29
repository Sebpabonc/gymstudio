import { useEffect, useMemo, useRef, useState } from 'react'
import { Exercise, SetEntry } from '../../domain/types'
import { compareSummaries, summarizeSets } from '../../domain/metrics'
import { goBack, navigate } from '../../app/router'
import { formatLongDate, toISODate } from '../../lib/dates'
import { formatNumber } from '../../lib/format'
import { repository, useRepositoryVersion } from '../../storage'
import { Draft, DraftSetRow, clearDraft, loadDraft, saveDraft } from '../../storage/drafts'
import { PreviousSessionCard } from './PreviousSessionCard'
import { SaveResult, SaveResultCard } from './SaveResultCard'
import { draftFromLog, emptyDraft, emptyRow, isDraftEmpty, rowFromSet, validateRows } from './draftUtils'

export function ExerciseScreen({ exercise }: { exercise: Exercise }) {
  const [today] = useState(() => toISODate())
  const version = useRepositoryVersion()
  const logs = useMemo(() => repository.getLogsForExercise(exercise.id), [exercise.id, version])
  const todayLog = logs.find((log) => log.date === today)
  const previous = logs.find((log) => log.date < today)

  const [draft, setDraft] = useState<Draft>(() => {
    const saved = loadDraft(exercise.id, today)
    if (saved) return saved
    return todayLog ? draftFromLog(todayLog) : emptyDraft()
  })
  const [dirty, setDirty] = useState(() => !!loadDraft(exercise.id, today))
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SaveResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dirty) saveDraft(exercise.id, today, draft)
  }, [draft, dirty, exercise.id, today])

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result])

  const edit = (update: (current: Draft) => Draft) => {
    setDraft(update)
    setDirty(true)
    setError(null)
    setResult(null)
  }

  const updateRow = (id: string, field: 'weight' | 'reps', value: string) =>
    edit((d) => ({ ...d, sets: d.sets.map((row) => (row.id === id ? { ...row, [field]: value } : row)) }))

  const fillRow = (id: string, set: SetEntry) =>
    edit((d) => ({ ...d, sets: d.sets.map((row) => (row.id === id ? { ...rowFromSet(set), id } : row)) }))

  const addRow = () =>
    edit((d) => {
      const last = d.sets[d.sets.length - 1]
      const next: DraftSetRow = last ? { ...last, id: emptyRow().id } : emptyRow()
      return { ...d, sets: [...d.sets, next] }
    })

  const removeRow = (id: string) =>
    edit((d) => ({ ...d, sets: d.sets.length > 1 ? d.sets.filter((row) => row.id !== id) : [emptyRow()] }))

  const copyPrevious = () => {
    if (previous) edit((d) => ({ ...d, sets: previous.sets.map(rowFromSet) }))
  }

  const save = () => {
    const validation = validateRows(draft.sets)
    if (!validation.ok) {
      setError(validation.error)
      return
    }
    try {
      const saved = repository.saveLog({
        exerciseId: exercise.id,
        date: today,
        sets: validation.sets,
        notes: draft.notes,
      })
      const summary = summarizeSets(saved.sets)
      setResult({
        summary,
        comparison: previous ? compareSummaries(summary, summarizeSets(previous.sets)) : undefined,
        updated: !!todayLog,
      })
      clearDraft(exercise.id, today)
      setDraft(draftFromLog(saved))
      setDirty(false)
      setError(null)
    } catch {
      setError('No se pudo guardar en este dispositivo. Revisa el almacenamiento del navegador.')
    }
  }

  const canCopyPrevious = !!previous && draft.sets.every((row) => !row.weight && !row.reps)
  const saveLabel = todayLog ? (dirty ? 'Actualizar sesión de hoy' : 'Guardado ✓') : 'Guardar'

  return (
    <div className="screen screen--with-bar">
      <header className="exercise-header">
        <button type="button" className="back-button" onClick={goBack} aria-label="Volver">
          ‹ <span>Buscar</span>
        </button>
        <p className="exercise-date">Hoy · {formatLongDate(today)}</p>
        <h1 className="exercise-title">{exercise.name}</h1>
        <div className="chips">
          <span className="chip">{exercise.primaryMuscle}</span>
          {exercise.secondaryMuscle && <span className="chip chip--subtle">{exercise.secondaryMuscle}</span>}
        </div>
        {exercise.notes && <p className="exercise-notes">{exercise.notes}</p>}
      </header>

      <PreviousSessionCard log={previous} today={today} />

      <section className="log-card" aria-label="Registro de hoy">
        <div className="log-head">
          <h2 className="section-label">Hoy</h2>
          {canCopyPrevious && (
            <button type="button" className="link-button" onClick={copyPrevious}>
              Copiar última vez
            </button>
          )}
        </div>

        {todayLog && !dirty && !result && <p className="log-hint">Ya guardaste este ejercicio hoy. Puedes editarlo.</p>}

        <div className="set-grid" role="table" aria-label="Series">
          <div className="set-row set-row--head" role="row">
            <span role="columnheader" aria-label="Serie">#</span>
            <span role="columnheader">Anterior</span>
            <span role="columnheader">kg</span>
            <span role="columnheader">Reps</span>
            <span aria-hidden="true" />
          </div>

          {draft.sets.map((row, i) => {
            const prevSet = previous?.sets[i]
            return (
              <div className="set-row" role="row" key={row.id}>
                <span className="set-num">{i + 1}</span>
                {prevSet ? (
                  <button
                    type="button"
                    className="set-prev"
                    onClick={() => fillRow(row.id, prevSet)}
                    aria-label={`Usar ${formatNumber(prevSet.weight)} kg por ${prevSet.reps} de la última vez`}
                  >
                    {formatNumber(prevSet.weight)} × {prevSet.reps}
                  </button>
                ) : (
                  <span className="set-prev set-prev--none">—</span>
                )}
                <input
                  className="set-input"
                  inputMode="decimal"
                  enterKeyHint="next"
                  placeholder={prevSet ? formatNumber(prevSet.weight) : '0'}
                  aria-label={`Peso serie ${i + 1} en kg`}
                  value={row.weight}
                  onChange={(e) => updateRow(row.id, 'weight', e.target.value)}
                />
                <input
                  className="set-input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="done"
                  placeholder={prevSet ? String(prevSet.reps) : '0'}
                  aria-label={`Repeticiones serie ${i + 1}`}
                  value={row.reps}
                  onChange={(e) => updateRow(row.id, 'reps', e.target.value)}
                />
                <button type="button" className="set-remove" onClick={() => removeRow(row.id)} aria-label={`Quitar serie ${i + 1}`}>
                  ×
                </button>
              </div>
            )
          })}
        </div>

        <button type="button" className="btn btn-ghost btn-block" onClick={addRow}>
          + Añadir serie
        </button>

        <label className="notes-field">
          <span className="section-label">Nota (opcional)</span>
          <input
            className="notes-input"
            type="text"
            placeholder="Sensaciones, ajustes…"
            value={draft.notes}
            onChange={(e) => edit((d) => ({ ...d, notes: e.target.value }))}
          />
        </label>
      </section>

      <div ref={resultRef}>{result && <SaveResultCard result={result} onDone={() => navigate('/')} />}</div>

      <div className="save-bar">
        {error && (
          <p className="save-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={save}
          disabled={(!!todayLog && !dirty) || (!todayLog && isDraftEmpty(draft))}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  )
}
