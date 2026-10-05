import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import SqueezeCue from './SqueezeCue'

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
  })
})
