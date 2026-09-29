import { ExerciseLog } from '../../domain/types'
import { summarizeSets } from '../../domain/metrics'
import { formatRelative, formatShortDate } from '../../lib/dates'
import { formatKg, formatNumber } from '../../lib/format'

export function PreviousSessionCard({ log, today }: { log?: ExerciseLog; today: string }) {
  if (!log) {
    return (
      <section className="prev-card prev-card--empty" aria-label="Última vez">
        <p className="prev-label">Última vez</p>
        <p className="prev-empty">Primera vez con este ejercicio. Lo que registres hoy será tu punto de partida.</p>
      </section>
    )
  }

  const summary = summarizeSets(log.sets)

  return (
    <section className="prev-card" aria-label="Última vez">
      <div className="prev-head">
        <p className="prev-label">Última vez</p>
        <p className="prev-date">
          {formatShortDate(log.date)} · {formatRelative(log.date, today)}
        </p>
      </div>

      <ol className="prev-sets">
        {log.sets.map((set, i) => (
          <li key={i}>
            <span className="prev-set-index">{i + 1}</span>
            <span className="prev-set-value">
              <strong>{formatNumber(set.weight)}</strong> kg × <strong>{set.reps}</strong>
            </span>
          </li>
        ))}
      </ol>

      <dl className="prev-stats">
        <div>
          <dt>Mejor serie</dt>
          <dd>{summary.topSet ? `${formatNumber(summary.topSet.weight)} × ${summary.topSet.reps}` : '—'}</dd>
        </div>
        <div>
          <dt>Volumen</dt>
          <dd>{formatKg(summary.volume)}</dd>
        </div>
        <div>
          <dt>1RM est.</dt>
          <dd>{formatKg(summary.bestE1RM)}</dd>
        </div>
      </dl>

      {log.notes && <p className="prev-notes">“{log.notes}”</p>}
    </section>
  )
}
