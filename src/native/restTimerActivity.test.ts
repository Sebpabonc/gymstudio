import { beforeEach, describe, expect, it, vi } from 'vitest'
import { restTimerActivityPayload, supportsRestTimerActivity } from './restTimerActivity'

const mocks = vi.hoisted(() => ({
  platform: 'web',
  available: false,
  start: vi.fn(),
  update: vi.fn(),
  end: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => mocks.platform,
    isPluginAvailable: () => mocks.available,
  },
  registerPlugin: () => ({ start: mocks.start, update: mocks.update, end: mocks.end }),
}))

describe('rest timer Live Activity bridge', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.platform = 'web'
    mocks.available = false
    mocks.start.mockResolvedValue(undefined)
    mocks.update.mockResolvedValue(undefined)
    mocks.end.mockResolvedValue(undefined)
  })

  it('mirrors localized next-set and countdown labels without changing old callers', () => {
    const labels = { restLabel: 'Descanso', goLabel: 'Ya', nextLabel: 'Siguiente: serie 2 · 32,5 kg × 10' }
    expect(restTimerActivityPayload({ endAt: 90_000 }, 'Press', 0, labels))
      .toEqual({ endAt: 90_000, exercise: 'Press', ...labels })
    expect(restTimerActivityPayload({ pausedRemainingMs: 15_000 }, 'Press', 1_000, labels))
      .toEqual({ endAt: 16_000, pausedRemainingMs: 15_000, exercise: 'Press', ...labels })
  })
  it('sends the end time while counting down', () => {
    expect(restTimerActivityPayload({ endAt: 1_000_090_000 }, 'Dumbbell Bench Press', 1_000_000_000))
      .toEqual({ endAt: 1_000_090_000, exercise: 'Dumbbell Bench Press' })
  })

  it('sends the remaining time while paused', () => {
    expect(restTimerActivityPayload({ pausedRemainingMs: 45_000 }, 'Rest', 1_000_000_000))
      .toEqual({ endAt: 1_000_045_000, pausedRemainingMs: 45_000, exercise: 'Rest' })
  })

  it('is a no-op on the web', () => {
    expect(supportsRestTimerActivity()).toBe(false)
  })

  it('ends an in-flight delayed start when rest is immediately undone', async () => {
    mocks.platform = 'ios'
    mocks.available = true
    let finishStart!: () => void
    mocks.start.mockImplementationOnce(() => new Promise<void>(resolve => { finishStart = resolve }))
    const { syncRestTimerActivity } = await import('./restTimerActivity')
    const start = syncRestTimerActivity({ endAt: Date.now() + 90_000 }, 'Press', true)
    await vi.waitFor(() => expect(mocks.start).toHaveBeenCalledOnce())
    const undo = syncRestTimerActivity(null, 'Press', false)
    expect(mocks.end).not.toHaveBeenCalled()
    finishStart()
    await Promise.all([start, undo])
    expect(mocks.end).toHaveBeenCalledOnce()
    expect(mocks.end.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.start.mock.invocationCallOrder[0])
  })

  it('skips a queued start canceled before it reaches the native bridge', async () => {
    mocks.platform = 'ios'
    mocks.available = true
    const { syncRestTimerActivity } = await import('./restTimerActivity')
    const start = syncRestTimerActivity({ endAt: Date.now() + 90_000 }, 'Press', true)
    const skip = syncRestTimerActivity(null, '', false)
    await Promise.all([start, skip])
    expect(mocks.start).not.toHaveBeenCalled()
    expect(mocks.end).toHaveBeenCalledOnce()
  })

  it('waits for delayed start and end before beginning a replacement rest', async () => {
    mocks.platform = 'ios'
    mocks.available = true
    let finishStart!: () => void
    let finishEnd!: () => void
    mocks.start.mockImplementationOnce(() => new Promise<void>(resolve => { finishStart = resolve }))
    mocks.end.mockImplementationOnce(() => new Promise<void>(resolve => { finishEnd = resolve }))
    const { syncRestTimerActivity } = await import('./restTimerActivity')
    const first = syncRestTimerActivity({ endAt: Date.now() + 90_000 }, 'Press', true)
    await vi.waitFor(() => expect(mocks.start).toHaveBeenCalledOnce())
    const skip = syncRestTimerActivity(null, '', false)
    const next = syncRestTimerActivity({ endAt: Date.now() + 120_000 }, 'Row', true, { nextLabel: 'Next: Row' })
    finishStart()
    await vi.waitFor(() => expect(mocks.end).toHaveBeenCalledOnce())
    expect(mocks.start).toHaveBeenCalledOnce()
    finishEnd()
    await Promise.all([first, skip, next])
    expect(mocks.start).toHaveBeenCalledTimes(2)
    expect(mocks.start).toHaveBeenLastCalledWith(expect.objectContaining({ exercise: 'Row', nextLabel: 'Next: Row' }))
    expect(mocks.start.mock.invocationCallOrder[1]).toBeGreaterThan(mocks.end.mock.invocationCallOrder[0])
  })

  it('discards queued stale updates before a rapid skip', async () => {
    mocks.platform = 'ios'
    mocks.available = true
    const { syncRestTimerActivity } = await import('./restTimerActivity')
    const endAt = Date.now() + 90_000
    await syncRestTimerActivity({ endAt }, 'Press', true)
    const extension = syncRestTimerActivity({ endAt: endAt + 15_000 }, 'Press', false)
    const skip = syncRestTimerActivity(null, '', false)
    await Promise.all([extension, skip])
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.end).toHaveBeenCalledOnce()
  })

  it('still sends end after a failed start and recovers for the next rest', async () => {
    mocks.platform = 'ios'
    mocks.available = true
    mocks.start.mockRejectedValueOnce(new Error('Native start failed'))
    const { syncRestTimerActivity } = await import('./restTimerActivity')
    await expect(syncRestTimerActivity({ endAt: Date.now() + 90_000 }, 'Press', true)).resolves.toBeUndefined()
    await syncRestTimerActivity(null, '', false)
    expect(mocks.end).toHaveBeenCalledOnce()
    await syncRestTimerActivity({ endAt: Date.now() + 90_000 }, 'Row', false)
    expect(mocks.start).toHaveBeenCalledTimes(2)
  })
})
