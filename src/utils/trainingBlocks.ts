import { TrainingBlock } from '../types'
import { localIsoDate } from '../lib/dates'

const DAY_MS = 24 * 60 * 60 * 1000

function toIsoDate(value: string | Date) {
  if (typeof value === 'string') return value.slice(0, 10)
  return localIsoDate(value)
}

function dateValue(value: string | Date) {
  return new Date(`${toIsoDate(value)}T00:00:00Z`).getTime()
}

function blockEnd(block: TrainingBlock) {
  return dateValue(block.startDate) + block.weeks * 7 * DAY_MS
}

function sortedBlocks(blocks: TrainingBlock[]) {
  return [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.number - b.number)
}

export function defaultActiveBlock(blocks: TrainingBlock[], today: string | Date = new Date()) {
  if (blocks.length === 0) return null
  const todayValue = dateValue(today)
  const sorted = sortedBlocks(blocks)
  return (
    sorted.find((block) => dateValue(block.startDate) <= todayValue && todayValue < blockEnd(block)) ??
    sorted.find((block) => dateValue(block.startDate) > todayValue) ??
    sorted[sorted.length - 1]
  )
}

export function blockWeek(block: TrainingBlock, today: string | Date = new Date()) {
  const todayValue = dateValue(today)
  const startValue = dateValue(block.startDate)
  if (todayValue < startValue || todayValue >= blockEnd(block)) return null
  return Math.floor((todayValue - startValue) / (7 * DAY_MS)) + 1
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(value)
}

export function blockDateRange(block: TrainingBlock) {
  const start = dateValue(block.startDate)
  const end = blockEnd(block) - DAY_MS
  const startYear = new Date(start).getUTCFullYear()
  const endYear = new Date(end).getUTCFullYear()
  return `${formatDate(start)}${startYear === endYear ? '' : ` ${startYear}`} – ${formatDate(end)} ${endYear}`
}
