import { Capacitor, registerPlugin } from '@capacitor/core'
import { isRestTimerPaused, RestTimerState } from '../utils/restTimer'

type RestTimerActivityPayload = {
  endAt: number
  pausedRemainingMs?: number
  exercise: string
  restLabel?: string
  goLabel?: string
  nextLabel?: string
}

export type RestTimerActivityLabels = Pick<RestTimerActivityPayload, 'restLabel' | 'goLabel' | 'nextLabel'>

type RestTimerActivityPlugin = {
  isAvailable(): Promise<{ available: boolean }>
  start(payload: RestTimerActivityPayload): Promise<void>
  update(payload: RestTimerActivityPayload): Promise<void>
  end(): Promise<void>
}

// Native side: ios/App/App/RestTimerActivityPlugin.swift (Live Activity in the Dynamic Island).
const RestTimerActivity = registerPlugin<RestTimerActivityPlugin>('RestTimerActivity')

let running = false
let revision = 0
let pending: Promise<void> = Promise.resolve()

export function supportsRestTimerActivity() {
  return Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('RestTimerActivity')
}

/** Builds the payload the native plugin expects from the app's rest timer state. */
export function restTimerActivityPayload(timer: RestTimerState, exercise: string, now = Date.now(), labels: RestTimerActivityLabels = {}): RestTimerActivityPayload {
  if (isRestTimerPaused(timer)) {
    return { endAt: now + timer.pausedRemainingMs, pausedRemainingMs: timer.pausedRemainingMs, exercise, ...labels }
  }
  return { endAt: timer.endAt, exercise, ...labels }
}

/**
 * Mirrors the in-app rest timer into the iPhone Dynamic Island / lock screen.
 * Serialized calls ensure Undo ends even a start that is still in flight.
 * No-op on the web and on devices without Live Activities; failures never affect the app.
 */
export async function syncRestTimerActivity(timer: RestTimerState | null, exercise: string, isNewRest: boolean, labels: RestTimerActivityLabels = {}) {
  if (!supportsRestTimerActivity()) return
  const current = ++revision
  pending = pending.then(async () => {
    if (timer && current !== revision) return
    try {
      if (!timer) {
        await RestTimerActivity.end()
        running = false
        return
      }
      const payload = restTimerActivityPayload(timer, exercise || labels.restLabel || 'Rest', Date.now(), labels)
      if (isNewRest || !running) {
        await RestTimerActivity.start(payload)
        running = true
      } else {
        await RestTimerActivity.update(payload)
      }
    } catch {
      running = false
    }
  })
  return pending
}
