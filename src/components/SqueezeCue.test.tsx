import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import SqueezeCue, { ShortCue } from './SqueezeCue'

describe('SqueezeCue', () => {
  it('keeps posture tips collapsed inside the squeeze cue box', () => {
    const html = renderToString(
      <SqueezeCue
        cue="Squeeze the target muscle."
        cueLabel="Squeeze"
        tips={['Tip one', 'Tip two']}
        tipsLabel="Posture tips"
        tipsId="posture-tips"
        expanded={false}
        onToggle={vi.fn()}
      />
    )

    expect(html).toContain('<section class="squeeze-cue-box">')
    expect(html.indexOf('Squeeze the target muscle.')).toBeLessThan(html.indexOf('id="posture-tips"'))
    expect(html).toContain('aria-label="Posture tips"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('id="posture-tips" class="squeeze-cue-tips" hidden=""')
    expect(html).toContain('<li>Tip one</li><li>Tip two</li>')
    expect(html).not.toContain('ask-ai-button')
  })

  it('makes the short workout cue a button that opens the details sheet', () => {
    const details = {
      title: 'Lat pulldown', closeLabel: 'Close', openLabel: 'Open details for Lat pulldown',
      sections: [{ heading: 'Last time', lines: ['Mon 12 Oct · 50×10'] }],
    }
    const html = renderToString(<ShortCue label="Squeeze" cue="Elbows back" details={details} id="cue" />)
    expect(html).toContain('<button type="button" class="workout-short-cue cue-card workout-short-cue-open" aria-haspopup="dialog"')
    expect(html).toContain('aria-label="Open details for Lat pulldown"')
  })

  it('keeps the short cue as plain text when there are no details', () => {
    const html = renderToString(<ShortCue label="Squeeze" cue="Elbows back" id="cue" />)
    expect(html).toContain('<p class="workout-short-cue cue-card">')
    expect(html).not.toContain('<button')
  })

  it('shows only the cue on screen; the Squeeze label is for screen readers only', () => {
    const html = renderToString(<ShortCue label="Squeeze" cue="Elbows back" id="cue" />)
    expect(html).toMatch(/<span class="sr-only">Squeeze(<!-- -->)?: <\/span>Elbows back/)
    expect(html).not.toContain('<strong>Squeeze')
  })
})
