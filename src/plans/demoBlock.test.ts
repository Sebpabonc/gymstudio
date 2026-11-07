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
    const current = blocks[blocks.length - 1]
    expect(current.id).toBe('user-tpl-4d-upper-lower-gym')
    expect(current.origin).toBe('pt')
    expect(current.days).toHaveLength(4)
    expect(current.startDate).toBe('2026-09-14')
  })

  it('QA 2026-11-07: adds four earlier completed cycles back to back, so the demo spans about six months', async () => {
    const blocks = await loadDemoBlocks('2026-10-05')
    expect(blocks.map((block) => block.startDate)).toEqual(['2026-03-30', '2026-05-11', '2026-06-22', '2026-08-03', '2026-09-14'])
    expect(blocks.slice(0, 4).map((block) => block.id)).toEqual([4, 3, 2, 1].map((cycle) => `user-tpl-4d-upper-lower-gym~past-${cycle}`))
    expect(new Set(blocks.map((block) => block.id)).size).toBe(5)
  })
})
