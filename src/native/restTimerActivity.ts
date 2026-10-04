import { Capacitor, registerPlugin } from '@capacitor/core'
import { isRestTimerPaused, RestTimerState } from '../utils/restTimer'

type RestTimerActivityPayload = {
  endAt: number
  pausedRemainingMs?: number
  exercise: string
}

type RestTimerActivityPlugin = {
  isAvailable(): Promise<{ available: boolean }>
  start(payload: RestTimerActivityPayload): Promise<void>
  update(payload: RestTimerActivityPayload): Promise<void>
  end(): Promise<void>
}

// Native side: ios/App/App/RestTimerActivityPlugin.swift (Live Activity in the Dynamic Island).
const RestTimerActivity = registerPlugin<RestTimerActivityPlugin>('RestTimerActivity')

let running = false

export function supportsRestTimerActivity() {
  return Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('RestTimerActivity')
}

/** Builds the payload the native plugin expects from the app's rest timer state. */
export function restTimerActivityPayload(timer: RestTimerState, exercise: string, now = Date.now()): RestTimerActivityPayload {
  if (isRestTimerPaused(timer)) {
    return { endAt: now + timer.pausedRemainingMs, pausedRemainingMs: timer.pausedRemainingMs, exercise }
  }
  return { endAt: timer.endAt, exercise }
}

/**
 * Mirrors the in-app rest timer into the iPhone Dynamic Island / lock screen.
 * No-op on the web and on devices without Live Activities; failures never affect the app.
 */
export async function syncRestTimerActivity(timer: RestTimerState | null, exercise: string, isNewRest: boolean) {
  if (!supportsRestTimerActivity()) return
  try {
    if (!timer) {
      if (running) await RestTimerActivity.end()
      running = false
      return
    }
    const payload = restTimerActivityPayload(timer, exercise || 'Rest')
    if (isNewRest || !running) {
      await RestTimerActivity.start(payload)
      running = true
    } else {
      await RestTimerActivity.update(payload)
    }
  } catch {
    running = false
  }
}
