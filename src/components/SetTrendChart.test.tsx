import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createTranslator } from '../i18n/translate'
import type { WorkoutTrendSession } from '../progress/workoutInsights'
import SetTrendChart from './SetTrendChart'

function renderChart(sets: WorkoutTrendSession['sets']) {
  return renderToString(
    <SetTrendChart
      sessions={[{
        date: '2026-10-12',
        dayType: 'A',
        deload: false,
        today: false,
        sets,
      }]}
      language="en"
      t={createTranslator('en')}
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
})
