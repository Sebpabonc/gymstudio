import { ISODate } from '../domain/types'

const LOCALE = 'es'

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date (not UTC), so late-night or early-morning sessions land on the right day. */
export function toISODate(date: Date = new Date()): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseISODate(value: ISODate): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(from: ISODate, to: ISODate): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime()
  return Math.round(ms / 86_400_000)
}

/** "martes, 29 de septiembre" */
export function formatLongDate(value: ISODate): string {
  return parseISODate(value).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** "jue 24 sep" */
export function formatShortDate(value: ISODate): string {
  return parseISODate(value)
    .toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/[.,]/g, '')
}

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas" */
export function formatRelative(value: ISODate, today: ISODate = toISODate()): string {
  const days = daysBetween(value, today)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 14) return `hace ${days} días`
  if (days < 60) return `hace ${Math.round(days / 7)} semanas`
  return `hace ${Math.round(days / 30)} meses`
}
