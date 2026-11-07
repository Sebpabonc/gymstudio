import { localIsoDate } from '../lib/dates'
import type { TrainingBlock } from '../types'
import type { SavedUserPlan } from '../utils/profileData'
import { withFloatingStart } from './rollingStart'
import { isNewUserDemo } from '../utils/demoMode'

export function selectPlanBlocks(
  globalBlocks: TrainingBlock[],
  personalPlan: SavedUserPlan | null,
  signedIn: boolean,
  demoMode: boolean,
): TrainingBlock[] {
  const personal = (signedIn && !demoMode) || isNewUserDemo()
  return personal && personalPlan ? [withFloatingStart(personalPlan.block, localIsoDate())] : globalBlocks
}
