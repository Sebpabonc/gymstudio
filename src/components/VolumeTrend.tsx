import type { VolumePoint } from '../utils/volumeTrend'
import { volumeTrendChange } from '../utils/volumeTrend'

interface Props {
  points: VolumePoint[]
  title: string
  changeLabel: (change: number) => string
  formatValue: (value: number) => string
}

const WIDTH = 280
const HEIGHT = 64
const PAD = 6

/** Small total-volume line chart for one exercise (oldest → newest). */
export function VolumeTrend({ points, title, changeLabel, formatValue }: Props) {
  if (points.length < 2) return null
  const values = points.map((point) => point.volume)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (index: number) => PAD + (index * (WIDTH - PAD * 2)) / (points.length - 1)
  const y = (value: number) => HEIGHT - PAD - ((value - min) / span) * (HEIGHT - PAD * 2)
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.volume).toFixed(1)}`).join(' ')
  const change = volumeTrendChange(points)
  const last = values[values.length - 1]

  return (
    <div className="volume-trend">
      <div className="volume-trend-head">
        <span>{title}</span>
        <strong>{formatValue(last)}</strong>
        {change !== null && (
          <small className={change > 0 ? 'volume-trend-up' : change < 0 ? 'volume-trend-down' : ''}>
            {changeLabel(change)}
          </small>
        )}
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title} preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#c9a0a6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => (
          <circle key={point.date + index} cx={x(index)} cy={y(point.volume)} r="3" fill="#c9a0a6" />
        ))}
      </svg>
    </div>
  )
}
