import { describe, expect, it } from 'vitest'
import { demoBlockStartDate, loadDemoBlocks } from './demoBlock'

describe('demo block', () => {
  it('starts on the Monday three weeks before this week', () => {
    expect(demoBlockStartDate('2026-10-05')).toBe('2026-09-14')
    expect(demoBlockStartDate('2026-10-11')).toBe('2026-09-14')
    expect(demoBlockStartDate('2026-10-07')).toBe('2026-09-14')
  })

  it('is built from the 4-day PT template, not the global blocks', async () => {
    const blocks = await loadDemoBlocks('2026-10-05')
    expect(blocks).toHaveLength(1)
    expect(blocks[0].id).toBe('user-tpl-4d-upper-lower-gym')
    expect(blocks[0].origin).toBe('pt')
    expect(blocks[0].days).toHaveLength(4)
    expect(blocks[0].startDate).toBe('2026-09-14')
  })
})
