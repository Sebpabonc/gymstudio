import { Language, localeFor } from './translate'

function toDate(value: string | Date) {
  return typeof value === 'string' ? new Date(`${value.slice(0, 10)}T12:00:00`) : value
}

/** "Oct 5" / "5 oct" style date, from an ISO yyyy-mm-dd string or a Date. */
export function formatShortDate(language: Language, value: string | Date) {
  return toDate(value).toLocaleDateString(localeFor(language), { month: 'short', day: 'numeric' })
}

/** "Mon 5 Oct" / "lun 5 oct" style date, without locale-specific commas or trailing periods. */
export function formatWeekdayDate(language: Language, value: string | Date) {
  const parts = new Intl.DateTimeFormat(localeFor(language), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(toDate(value))
  const pick = (type: string) => (parts.find((part) => part.type === type)?.value ?? '').replace(/\.$/, '')
  return `${pick('weekday')} ${pick('day')} ${pick('month')}`
}

export function formatLongDate(language: Language, value: string | Date) {
  return toDate(value).toLocaleDateString(localeFor(language), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatNumber(language: Language, value: number, options?: Intl.NumberFormatOptions) {
  const locale = language === 'es' ? 'es-ES' : localeFor(language)
  return new Intl.NumberFormat(locale, { useGrouping: true, ...options }).format(value)
}
