import { useMemo } from 'react'
import { exerciseLibrary } from '../../data/exercises'
import { Exercise, ID, ISODate } from '../../domain/types'
import { exercisePath, navigate } from '../../app/router'
import { formatLongDate, formatRelative, toISODate } from '../../lib/dates'
import { buildSearchIndex, searchExercises } from '../../lib/search'
import { repository, useRepositoryVersion } from '../../storage'

const searchIndex = buildSearchIndex(exerciseLibrary)
const alphabetical = [...exerciseLibrary].sort((a, b) => a.name.localeCompare(b.name, 'es'))
const RECENT_LIMIT = 5

interface Props {
  query: string
  onQueryChange: (value: string) => void
}

export function SearchScreen({ query, onQueryChange }: Props) {
  const version = useRepositoryVersion()
  const today = toISODate()
  const lastDates = useMemo(() => repository.getLastLoggedDates(), [version])
  const results = useMemo(() => searchExercises(searchIndex, query), [query])
  const hasQuery = query.trim().length > 0

  const recent = useMemo(
    () =>
      Array.from(lastDates.keys())
        .map((id) => exerciseLibrary.find((e) => e.id === id))
        .filter((e): e is Exercise => !!e)
        .slice(0, RECENT_LIMIT),
    [lastDates]
  )

  return (
    <div className="screen">
      <header className="home-header">
        <h1 className="wordmark">Gym Studio</h1>
        <p className="home-date">{formatLongDate(today)}</p>
      </header>

      <div className="search-bar" role="search">
        <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          className="search-input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Buscar ejercicio"
          aria-label="Buscar ejercicio"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) navigate(exercisePath(results[0].id))
          }}
        />
        {hasQuery && (
          <button type="button" className="search-clear" aria-label="Borrar búsqueda" onClick={() => onQueryChange('')}>
            ×
          </button>
        )}
      </div>

      <main>
        {hasQuery ? (
          results.length > 0 ? (
            <ExerciseList exercises={results} lastDates={lastDates} today={today} />
          ) : (
            <p className="empty">Sin resultados para “{query.trim()}”.</p>
          )
        ) : (
          <>
            {recent.length > 0 && (
              <section>
                <h2 className="section-label">Recientes</h2>
                <ExerciseList exercises={recent} lastDates={lastDates} today={today} />
              </section>
            )}
            <section>
              <h2 className="section-label">Todos los ejercicios</h2>
              <ExerciseList exercises={alphabetical} lastDates={lastDates} today={today} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function ExerciseList({
  exercises,
  lastDates,
  today,
}: {
  exercises: Exercise[]
  lastDates: Map<ID, ISODate>
  today: ISODate
}) {
  return (
    <ul className="exercise-list">
      {exercises.map((exercise) => {
        const last = lastDates.get(exercise.id)
        return (
          <li key={exercise.id}>
            <a className="exercise-row" href={`#${exercisePath(exercise.id)}`} onClick={(e) => {
              e.preventDefault()
              navigate(exercisePath(exercise.id))
            }}>
              <span className="exercise-row-main">
                <span className="exercise-row-name">{exercise.name}</span>
                <span className="exercise-row-meta">
                  {exercise.primaryMuscle}
                  {exercise.secondaryMuscle ? ` · ${exercise.secondaryMuscle}` : ''}
                </span>
              </span>
              {last && <span className={last === today ? 'last-pill today' : 'last-pill'}>{formatRelative(last, today)}</span>}
              <span className="chevron" aria-hidden="true">›</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
