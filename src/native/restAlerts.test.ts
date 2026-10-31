import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTranslator } from '../i18n/translate'

const mocks = vi.hoisted(() => ({
  native: true,
  cancel: vi.fn(),
  check: vi.fn(),
  request: vi.fn(),
  schedule: vi.fn(),
  haptics: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => mocks.native } }))
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: { cancel: mocks.cancel, checkPermissions: mocks.check, requestPermissions: mocks.request, schedule: mocks.schedule },
}))
vi.mock('@capacitor/haptics', () => ({
  Haptics: { notification: mocks.haptics }, NotificationType: { Success: 'SUCCESS' },
}))
const labels = {
  restLabel: 'Descanso', goLabel: 'Ya', nextLabel: 'Siguiente: serie 2',
  permissionReason: 'Permite las notificaciones para avisarte cuando termine el descanso.',
}

describe('rest alerts', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.native = true
    mocks.cancel.mockResolvedValue(undefined)
    mocks.check.mockResolvedValue({ display: 'granted' })
    mocks.request.mockResolvedValue({ display: 'granted' })
    mocks.schedule.mockResolvedValue(undefined)
    mocks.haptics.mockResolvedValue(undefined)
    vi.stubGlobal('window', { confirm: vi.fn(() => true) })
    vi.stubGlobal('document', { visibilityState: 'visible' })
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('explains permission on the first rest start and schedules localized completion', async () => {
    mocks.check.mockResolvedValue({ display: 'prompt' })
    const { scheduleRestAlert } = await import('./restAlerts')
    const endAt = Date.now() + 120_000
    await scheduleRestAlert({ endAt }, labels)
    expect(window.confirm).toHaveBeenCalledWith(labels.permissionReason)
    expect(mocks.request).toHaveBeenCalledOnce()
    expect(mocks.schedule).toHaveBeenCalledWith({
      notifications: [{ id: 381, title: 'Descanso · Ya', body: 'Siguiente: serie 2', schedule: { at: new Date(endAt) }, sound: 'default' }],
    })

    await scheduleRestAlert({ endAt: endAt + 15_000 }, labels)
    expect(mocks.request).toHaveBeenCalledOnce()
  })

  it('exposes centralized language-aware scheduling and foreground completion APIs', async () => {
    const { syncRestAlerts, notifyRestEnded } = await import('./restAlerts')
    const endAt = Date.now() + 90_000
    await syncRestAlerts({ endAt }, 'Next: Set 2', 'en')
    expect(mocks.schedule).toHaveBeenLastCalledWith({
      notifications: [expect.objectContaining({ title: `Rest · ${createTranslator('en')('rest.done')}`, body: 'Next: Set 2' })],
    })
    await syncRestAlerts({ endAt }, 'Siguiente: serie 2', 'es')
    expect(mocks.schedule).toHaveBeenLastCalledWith({
      notifications: [expect.objectContaining({ title: `Descanso · ${createTranslator('es')('rest.done')}`, body: 'Siguiente: serie 2' })],
    })
    await syncRestAlerts(null, '', 'en')
    expect(mocks.cancel).toHaveBeenCalledTimes(3)
    notifyRestEnded()
    expect(mocks.haptics).toHaveBeenCalledOnce()
  })

  it('does not nag after declining permission or block timers after errors', async () => {
    mocks.check.mockResolvedValue({ display: 'prompt' })
    vi.mocked(window.confirm).mockReturnValue(false)
    const { scheduleRestAlert } = await import('./restAlerts')
    await scheduleRestAlert({ endAt: Date.now() + 90_000 }, labels)
    await scheduleRestAlert({ endAt: Date.now() + 100_000 }, labels)
    expect(window.confirm).toHaveBeenCalledOnce()
    expect(mocks.request).not.toHaveBeenCalled()
    expect(mocks.schedule).not.toHaveBeenCalled()
    mocks.cancel.mockRejectedValue(new Error('Unavailable'))
    await expect(scheduleRestAlert(null, labels)).resolves.toBeUndefined()
  })

  it('cancels on skip, undo or pause and reschedules extensions instead of stacking alerts', async () => {
    const { scheduleRestAlert, cancelRestAlert } = await import('./restAlerts')
    const endAt = Date.now() + 90_000
    await scheduleRestAlert({ endAt }, labels)
    await scheduleRestAlert({ endAt: endAt + 15_000 }, labels)
    expect(mocks.schedule).toHaveBeenLastCalledWith({
      notifications: [expect.objectContaining({ schedule: { at: new Date(endAt + 15_000) } })],
    })
    await cancelRestAlert()
    await cancelRestAlert()
    await scheduleRestAlert({ pausedRemainingMs: 30_000 }, labels)
    expect(mocks.cancel).toHaveBeenCalledTimes(5)
    expect(mocks.schedule).toHaveBeenCalledTimes(2)
  })

  it('cannot schedule a rest canceled while the OS permission dialog is open', async () => {
    mocks.check.mockResolvedValue({ display: 'prompt' })
    let resolvePermission!: (value: { display: string }) => void
    mocks.request.mockImplementation(() => new Promise(resolve => { resolvePermission = resolve }))
    const { scheduleRestAlert, cancelRestAlert } = await import('./restAlerts')
    const scheduling = scheduleRestAlert({ endAt: Date.now() + 90_000 }, labels)
    await vi.waitFor(() => expect(mocks.request).toHaveBeenCalled())
    const cancellation = cancelRestAlert()
    resolvePermission({ display: 'granted' })
    await Promise.all([scheduling, cancellation])
    expect(mocks.schedule).not.toHaveBeenCalled()
    expect(mocks.cancel).toHaveBeenCalledTimes(2)
  })

  it('uses native foreground haptics but not background haptics', async () => {
    const { fireRestAlert } = await import('./restAlerts')
    fireRestAlert()
    expect(mocks.haptics).toHaveBeenCalledWith({ type: 'SUCCESS' })
    vi.stubGlobal('document', { visibilityState: 'hidden' })
    fireRestAlert()
    expect(mocks.haptics).toHaveBeenCalledOnce()
  })

  it('unlocks browser audio from Done and beeps/vibrates at zero, without native permissions', async () => {
    mocks.native = false
    const oscillator = { connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 }, onended: undefined as (() => void) | undefined }
    const gain = { connect: vi.fn(), disconnect: vi.fn(), gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } }
    const audio = { resume: vi.fn().mockResolvedValue(undefined), createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain), currentTime: 0, destination: {}, state: 'running' }
    vi.stubGlobal('window', { AudioContext: vi.fn(() => audio) })
    vi.stubGlobal('navigator', { vibrate: vi.fn() })
    const { prepareRestAlerts, fireRestAlert, scheduleRestAlert } = await import('./restAlerts')
    prepareRestAlerts()
    fireRestAlert()
    expect(audio.resume).toHaveBeenCalled()
    expect(oscillator.frequency.value).toBe(880)
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.15, 0)
    expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200])
    oscillator.onended?.()
    expect(oscillator.disconnect).toHaveBeenCalledOnce()
    expect(gain.disconnect).toHaveBeenCalledOnce()
    await scheduleRestAlert({ endAt: Date.now() + 90_000 }, labels)
    expect(mocks.check).not.toHaveBeenCalled()
  })
})
