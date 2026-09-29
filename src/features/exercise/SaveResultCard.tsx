import { Comparison, SetsSummary, Trend } from '../../domain/metrics'
import { formatKg, formatNumber, formatSigned } from '../../lib/format'

export interface SaveResult {
  summary: SetsSummary
  comparison?: Comparison
  updated: boolean
}

const HEADLINE: Record<Trend, string> = {
  up: 'Mejor que la última vez',
  same: 'Igual que la última vez',
  down: 'Por debajo de la última vez',
}

function Delta({ value, suffix = '' }: { value: number; suffix?: string }) {
  const rounded = Math.round(value * 10) / 10
  const cls = rounded > 0 ? 'delta up' : rounded < 0 ? 'delta down' : 'delta'
  const arrow = rounded > 0 ? '▲ ' : rounded < 0 ? '▼ ' : ''
  if (rounded === 0) return <span className="delta">= sin cambio</span>
  return (
    <span className={cls}>
      {arrow}
      {formatSigned(value)}
      {suffix}
    </span>
  )
}

export function SaveResultCard({ result, onDone }: { result: SaveResult; onDone: () => void }) {
  const { summary, comparison } = result
  const trend = comparison?.trend

  return (
    <section className={`result-card ${trend ? `result-card--${trend}` : ''}`} role="status" aria-live="polite">
      <p className="result-kicker">{result.updated ? 'Sesión actualizada' : 'Guardado'} ✓</p>
      <h2 className="result-headline">{trend ? HEADLINE[trend] : 'Primera sesión registrada'}</h2>

      <dl className="result-stats">
        <div>
          <dt>Mejor serie</dt>
          <dd>{summary.topSet ? `${formatNumber(summary.topSet.weight)} × ${summary.topSet.reps}` : '—'}</dd>
          {comparison && <Delta value={comparison.topWeightDelta} suffix=" kg" />}
        </div>
        <div>
          <dt>Volumen</dt>
          <dd>{formatKg(summary.volume)}</dd>
          {comparison && (
            <Delta
              value={comparison.volumeDeltaPct !== undefined ? comparison.volumeDeltaPct * 100 : comparison.volumeDelta}
              suffix={comparison.volumeDeltaPct !== undefined ? '%' : ' kg'}
            />
          )}
        </div>
        <div>
          <dt>1RM est.</dt>
          <dd>{formatKg(summary.bestE1RM)}</dd>
          {comparison && <Delta value={comparison.e1rmDelta} suffix=" kg" />}
        </div>
      </dl>

      <button type="button" className="btn btn-ghost btn-block" onClick={onDone}>
        Buscar otro ejercicio
      </button>
    </section>
  )
}
