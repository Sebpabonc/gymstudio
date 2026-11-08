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
  it('draws reps as bar height and one load under the group when every set uses the same load', () => {
    const html = renderChart([
      { weight: 30, reps: 10, logged: true },
      { weight: 30, reps: 9, logged: true },
      { weight: 30, reps: 8, logged: true },
    ])

    expect(html.match(/class="set-trend-weight-label"/g)).toHaveLength(1)
    expect(html).toContain('>30 kg<')
    expect(html).not.toContain('rotate(')
    const heights = [...html.matchAll(/class="set-trend-bar" x="[^"]+" y="[^"]+" width="10" height="([^"]+)"/g)].map((match) => Number(match[1]))
    expect(heights[0]).toBeGreaterThan(heights[1])
    expect(heights[1]).toBeGreaterThan(heights[2])
  })

  it('writes each set load under its bar on one row when loads differ', () => {
    const html = renderChart([
      { weight: 28, reps: 14, logged: true },
      { weight: 30, reps: 12, logged: true },
      { weight: 32, reps: 8, logged: true },
    ])

    const labels = [...html.matchAll(/class="set-trend-weight-label per-set" x="[^"]+" y="([^"]+)"[^>]*>([^<]+)</g)]
    expect(labels.map((match) => match[2])).toEqual(['28', '30', '32'])
    expect(new Set(labels.map((match) => match[1])).size).toBe(1)
  })

  it('fits decimal per-set loads of a three-set reverse pyramid under their bars', () => {
    const html = renderChart([
      { weight: 52.5, reps: 8, logged: true },
      { weight: 47.5, reps: 10, logged: true },
      { weight: 42.5, reps: 12, logged: true },
    ])

    expect(html.match(/class="set-trend-weight-label per-set"/g)).toHaveLength(3)
  })

  it('falls back to the load range when per-set loads would not fit under their bars', () => {
    const html = renderChart([
      { weight: 52.5, reps: 8, logged: true },
      { weight: 47.5, reps: 10, logged: true },
      { weight: 42.5, reps: 12, logged: true },
      { weight: 37.5, reps: 12, logged: true },
      { weight: 32.5, reps: 15, logged: true },
    ])

    expect(html.match(/class="set-trend-weight-label"/g)).toHaveLength(1)
    expect(html).toContain('32.5–52.5 kg')
  })

  it('shades the plan goal behind logged bars and marks a missed goal as done/goal', () => {
    const html = renderChart([
      { weight: 28, reps: 14, logged: true, targetReps: 14 },
      { weight: 30, reps: 12, logged: true, targetReps: 12 },
      { weight: 32, reps: 8, logged: true, targetReps: 10 },
    ], { language: 'es' })

    expect(html.match(/class="set-trend-goal"/g)).toHaveLength(3)
    expect(html).toContain('class="set-trend-reps-label missed"')
    expect(html).toContain('>8/10<')
    expect(html.match(/missed/g)).toHaveLength(1)
    expect(html).toContain('S3 32 kg × 8 (meta 10)')
    expect(html).toContain('Meta del plan')
  })

  it('draws a set still to do at its plan goal, with no shade behind it', () => {
    const html = renderChart([
      { weight: 32, reps: 8, logged: true, targetReps: 10 },
      { weight: 32, reps: 8, logged: false, targetReps: 10 },
    ], { today: true })

    expect(html.match(/class="set-trend-goal"/g)).toHaveLength(1)
    expect(html).toContain('S2 32 kg × 10 target')
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
    expect(html).not.toContain('Plan goal')
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
    // 3 whole 100 px groups fit in 311 px, so the window starts just before group index 2.
    expect(scroll).toBe(38 + 2 * 100 - 4)
    expect(width - scroll).toBe(311)
    expect(scroll + 311).toBeGreaterThanOrEqual(38 + 5 * 100 - 2)
  })
})
