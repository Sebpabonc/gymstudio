import type { TrainingBlock } from '../types'
import type { SavedUserPlan } from '../utils/profileData'

export function selectPlanBlocks(
  globalBlocks: TrainingBlock[],
  personalPlan: SavedUserPlan | null,
  signedIn: boolean,
  demoMode: boolean,
): TrainingBlock[] {
  return signedIn && !demoMode && personalPlan ? [personalPlan.block] : globalBlocks
}
