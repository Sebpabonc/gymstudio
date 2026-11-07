import { localIsoDate } from '../lib/dates'
import type { TrainingBlock } from '../types'
import type { SavedUserPlan } from '../utils/profileData'
import { withFloatingStart } from './rollingStart'

export function selectPlanBlocks(
  globalBlocks: TrainingBlock[],
  personalPlan: SavedUserPlan | null,
  signedIn: boolean,
  demoMode: boolean,
): TrainingBlock[] {
  return signedIn && !demoMode && personalPlan ? [withFloatingStart(personalPlan.block, localIsoDate())] : globalBlocks
}
