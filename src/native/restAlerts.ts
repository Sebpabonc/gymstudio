import { Capacitor } from '@capacitor/core'
import { Haptics, NotificationType } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { isRestTimerPaused, RestTimerState } from '../utils/restTimer'
import type { Language } from '../i18n'
import { createTranslator } from '../i18n/translate'

const REST_NOTIFICATION_ID = 381
let audioContext: AudioContext | undefined
let permissionAttempted = false
let revision = 0
let pending: Promise<void> = Promise.resolve()

export type RestAlertLabels = {
  restLabel: string
  goLabel: string
  nextLabel?: string
  permissionReason: string
}

/** Call from Done's user gesture: browsers require this to unlock the completion beep. */
export function prepareRestAlerts(): void {
  if (Capacitor.isNativePlatform() || typeof window === 'undefined') return
  try {
    const Audio = window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Audio) return
    audioContext ??= new Audio()
    void audioContext.resume().catch(() => undefined)
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    gain.gain.value = 0
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.01)
  } catch {
    // Alerts are optional; unsupported audio must never prevent a set from saving.
  }
}

/** Serializes cancellation/scheduling so an obsolete permission request cannot resurrect a timer. */
export function scheduleRestAlert(timer: RestTimerState | null, labels: RestAlertLabels): Promise<void> {
  const current = ++revision
  pending = pending.then(async () => {
    if (!Capacitor.isNativePlatform()) return
    await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIFICATION_ID }] })
    if (current !== revision || !timer || isRestTimerPaused(timer) || timer.endAt <= Date.now()) return
    let permission = await LocalNotifications.checkPermissions()
    if (permission.display === 'prompt' && !permissionAttempted) {
      permissionAttempted = true
      if (typeof window !== 'undefined' && window.confirm(labels.permissionReason)) {
        permission = await LocalNotifications.requestPermissions()
      }
    }
    if (current !== revision || permission.display !== 'granted' || timer.endAt <= Date.now()) return
    await LocalNotifications.schedule({
      notifications: [{
        id: REST_NOTIFICATION_ID,
        title: `${labels.restLabel} · ${labels.goLabel}`,
        body: labels.nextLabel || labels.goLabel,
        schedule: { at: new Date(timer.endAt) },
        sound: 'default',
      }],
    })
  }).catch(() => undefined)
  return pending
}

export function cancelRestAlert(): Promise<void> {
  return scheduleRestAlert(null, { restLabel: '', goLabel: '', permissionReason: '' })
}

export function syncRestAlerts(timer: RestTimerState | null, nextLabel: string, language: Language): Promise<void> {
  const t = createTranslator(language)
  return scheduleRestAlert(timer, {
    restLabel: t('rest.title'),
    goLabel: t('rest.done'),
    nextLabel,
    permissionReason: t('rest.permissionReason'),
  })
}

export function fireRestAlert(): void {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  if (Capacitor.isNativePlatform()) {
    void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined)
    return
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([200, 100, 200])
  }
  try {
    if (!audioContext || audioContext.state !== 'running') return
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.15, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.4)
  } catch {
    // An unavailable alert is not a workout error.
  }
}

export { fireRestAlert as notifyRestEnded }
