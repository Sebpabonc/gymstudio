import { describe, expect, it } from 'vitest'
import type { TrainingBlock } from '../types'
import type { SavedUserPlan } from '../utils/profileData'
import { selectPlanBlocks } from './selectPlanBlocks'

const globalBlock = { id: 'global' } as TrainingBlock
const personalBlock = { id: 'personal' } as TrainingBlock
const personalPlan = { block: personalBlock } as SavedUserPlan

describe('selectPlanBlocks', () => {
  it('uses the personal block for a signed-in user with a plan', () => {
    expect(selectPlanBlocks([globalBlock], personalPlan, true, false)).toEqual([personalBlock])
  })

  it('keeps global blocks for guests, users without a plan, and demo mode', () => {
    expect(selectPlanBlocks([globalBlock], personalPlan, false, false)).toEqual([globalBlock])
    expect(selectPlanBlocks([globalBlock], null, true, false)).toEqual([globalBlock])
    expect(selectPlanBlocks([globalBlock], personalPlan, true, true)).toEqual([globalBlock])
  })
})
