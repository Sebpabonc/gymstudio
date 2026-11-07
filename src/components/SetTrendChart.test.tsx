import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import type { WorkoutTrendSession } from '../progress/workoutInsights'
import SetTrendChart, { alignedTrendScroll } from './SetTrendChart'

function renderChart(sets: WorkoutTrendSession['sets'], options: { language?: 'en' | 'es'; today?: boolean; dayType?: string | null } = {}) {
  const language = options.language ?? 'en'
  return renderToString(
    <SetTrendChart
      sessions={[{
        date: '2026-10-12',
        dayType: options.dayType === undefined ? 'A' : options.dayType,
        deload: false,
        today: options.today ?? false,
        sets,
      }]}
      language={language}
      t={createTranslator(language)}
    />
  )
}

describe('SetTrendChart', () => {
  it('shows one centered load label when a session uses the same load for every set', () => {
    const html = renderChart([
      { weight: 30, reps: 10, logged: true },
      { weight: 30, reps: 9, logged: true },
      { weight: 30, reps: 8, logged: true },
    ])

    expect(html.match(/class="set-trend-weight-label"/g)).toHaveLength(1)
    expect(html).not.toContain('rotate(-45')
  })

  it('rotates per-set load labels when loads differ within a session', () => {
    const html = renderChart([
      { weight: 52.5, reps: 8, logged: true },
      { weight: 45, reps: 10, logged: true },
      { weight: 40, reps: 12, logged: true },
    ])

    expect(html.match(/class="set-trend-weight-label"/g)).toHaveLength(3)
    expect(html.match(/rotate\(-45/g)).toHaveLength(3)
  })

  it('shows an empty state instead of 0 kg target bars for a first-time exercise', () => {
    const html = renderChart([
      { weight: 0, reps: 8, logged: false },
      { weight: 0, reps: 8, logged: false },
    ], { today: true })

    expect(html).toContain("Your trend starts after today&#x27;s sets.")
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('0 kg')
  })

  it('charts bodyweight history in reps with no kg axis', () => {
    const html = renderChart([
      { weight: 0, reps: 10, logged: true },
      { weight: 0, reps: 12, logged: true },
    ])

    expect(html).toContain('<svg')
    expect(html).not.toMatch(/\bkg\b/)
    expect(html).toContain('S1 10 reps')
    expect(html).toContain('Bars show reps per set')
  })

  it('drops 0 kg target bars when the history has load', () => {
    const html = renderChart([
      { weight: 30, reps: 10, logged: true },
      { weight: 0, reps: 10, logged: false },
    ], { today: true })

    expect(html).not.toContain('S2')
    expect(html.match(/class="set-trend-bar/g)).toHaveLength(1)
  })

  it('translates the planned-set marker and keeps the chart a single tab stop', () => {
    const html = renderChart([
      { weight: 12, reps: 8, logged: true },
      { weight: 12, reps: 8, logged: false },
    ], { language: 'es', today: true })

    expect(html).toContain('S2 12 kg × 8 objetivo')
    expect(html).not.toContain(' target')
    expect(html).not.toContain('role="button"')
    expect(html.match(/tabindex="0"/gi)).toHaveLength(1)
    expect(html).not.toContain('visually-hidden')
  })

  it('omits the day letter when the plan day has none', () => {
    const html = renderChart([{ weight: 20, reps: 8, logged: true }], { dayType: null })

    expect(html).toContain('Oct 12: S1 20 kg × 8')
    expect(html).not.toContain('()')
  })
})

describe('alignedTrendScroll', () => {
  it('starts at the left when everything fits', () => {
    expect(alignedTrendScroll(2, 343)).toEqual({ scroll: 0, width: 280 })
  })

  it('starts the visible area on a whole group and keeps the newest group in full', () => {
    const { scroll, width } = alignedTrendScroll(5, 311)
    // 3 whole 92 px groups fit in 311 px, so the window starts just before group index 2.
    expect(scroll).toBe(38 + 2 * 92 - 4)
    expect(width - scroll).toBe(311)
    expect(scroll + 311).toBeGreaterThanOrEqual(38 + 5 * 92 - 2)
  })
})
