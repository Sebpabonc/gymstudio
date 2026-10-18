import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { shortSqueezeCues } from './shortSqueezeCues'

describe('approved short squeeze cues', () => {
  it('matches every bilingual cue and exercise ID in the approved source table', () => {
    const source = readFileSync(resolve(process.cwd(), 'docs/fitness/approved/2026-10-18-short-squeeze-cues.md'), 'utf8')
    const rows = [...source.matchAll(/^\| `([^`]+)` \|.*\| ([^|]+) \| ([^|]+) \|$/gm)]
    const approved = Object.fromEntries(rows.map(([, id, en, es]) => [
      id,
      { en: en.trim(), es: es.trim() },
    ]))

    expect(rows.length).toBeGreaterThan(0)
    expect(shortSqueezeCues).toEqual(approved)
  })
})
