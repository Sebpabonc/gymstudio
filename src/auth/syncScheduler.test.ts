import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SyncSignInRequiredError } from '../utils/sync'
import { createSyncScheduler } from './syncScheduler'

describe('account sync scheduling', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  const setup = (sync = vi.fn<[], Promise<void>>().mockResolvedValue(undefined)) => {
    let online = true
    const onOffline = vi.fn()
    const onError = vi.fn()
    const scheduler = createSyncScheduler({ sync, isOnline: () => online, onOffline, onError })
    return { scheduler, sync, onOffline, onError, setOnline: (value: boolean) => { online = value } }
  }

  it('backs off from 10 seconds, doubles to a five-minute cap, and keeps only one timer', async () => {
    const { scheduler, sync } = setup(vi.fn().mockRejectedValue(new Error('network')))
    scheduler.retryNow()
    await vi.advanceTimersByTimeAsync(0)
    for (const delay of [10_000, 20_000, 40_000, 80_000, 160_000, 300_000, 300_000]) {
      const calls = sync.mock.calls.length
      expect(vi.getTimerCount()).toBe(1)
      await vi.advanceTimersByTimeAsync(delay - 1)
      expect(sync).toHaveBeenCalledTimes(calls)
      await vi.advanceTimersByTimeAsync(1)
      expect(sync).toHaveBeenCalledTimes(calls + 1)
    }
    scheduler.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not retry a resolved sync containing only quarantined entries', async () => {
    const { scheduler, sync } = setup()
    scheduler.retryNow()
    await vi.advanceTimersByTimeAsync(600_000)
    expect(sync).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels the backoff for manual retry and resets it after success', async () => {
    const sync = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(undefined)
      .mockRejectedValue(new Error('network'))
    const { scheduler } = setup(sync)
    scheduler.retryNow()
    await vi.advanceTimersByTimeAsync(0)
    scheduler.retryNow()
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
    scheduler.historySaved()
    await vi.advanceTimersByTimeAsync(2_000)
    await vi.advanceTimersByTimeAsync(9_999)
    expect(sync).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(1)
    expect(sync).toHaveBeenCalledTimes(4)
    scheduler.dispose()
  })

  it('does not schedule retries when sign-in is required until manual retry', async () => {
    const { scheduler, sync } = setup(vi.fn().mockRejectedValue(new SyncSignInRequiredError()))
    scheduler.retryNow()
    await vi.advanceTimersByTimeAsync(0)
    scheduler.historySaved()
    scheduler.online()
    await vi.advanceTimersByTimeAsync(600_000)
    expect(sync).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    scheduler.retryNow()
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(2)
  })

  it('waits offline, cancels queued timers, and syncs immediately on reconnect', async () => {
    const { scheduler, sync, onOffline, setOnline } = setup(vi.fn().mockRejectedValue(new Error('network')))
    setOnline(false)
    scheduler.retryNow()
    expect(onOffline).toHaveBeenCalledOnce()
    expect(sync).not.toHaveBeenCalled()
    scheduler.historySaved()
    expect(vi.getTimerCount()).toBe(0)
    setOnline(true)
    scheduler.online()
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledOnce()
    setOnline(false)
    scheduler.offline()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(600_000)
    expect(sync).toHaveBeenCalledOnce()
    setOnline(true)
    scheduler.online()
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(2)
    scheduler.dispose()
  })

  it('debounces saves and runs one follow-up when requested during an active sync', async () => {
    let resolve!: () => void
    const sync = vi.fn().mockImplementationOnce(() => new Promise<void>(done => { resolve = done }))
      .mockResolvedValue(undefined)
    const { scheduler } = setup(sync)
    scheduler.historySaved()
    scheduler.historySaved()
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(2_000)
    scheduler.retryNow()
    scheduler.online()
    expect(sync).toHaveBeenCalledOnce()
    resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ignores a previous account completing after disposal', async () => {
    let reject!: (error: Error) => void
    const sync = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail }))
    const { scheduler, onError } = setup(sync)
    scheduler.retryNow()
    scheduler.dispose()
    reject(new Error('old account'))
    await vi.advanceTimersByTimeAsync(600_000)
    expect(onError).not.toHaveBeenCalled()
    expect(sync).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not enqueue a retry if connection is lost during the request', async () => {
    let reject!: (error: Error) => void
    const sync = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail }))
    const { scheduler, onOffline, setOnline } = setup(sync)
    scheduler.retryNow()
    setOnline(false)
    scheduler.offline()
    reject(new Error('network lost'))
    await vi.advanceTimersByTimeAsync(0)
    expect(onOffline).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    scheduler.dispose()
  })

  it('honors reconnect immediately after an in-flight offline request fails', async () => {
    let reject!: (error: Error) => void
    const sync = vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail }))
      .mockResolvedValue(undefined)
    const { scheduler, setOnline } = setup(sync)
    scheduler.retryNow()
    setOnline(false)
    scheduler.offline()
    setOnline(true)
    scheduler.online()
    reject(new Error('old request failed'))
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves exponential backoff when new history is saved while waiting', async () => {
    const { scheduler, sync } = setup(vi.fn().mockRejectedValue(new Error('network')))
    scheduler.retryNow()
    await vi.advanceTimersByTimeAsync(5_000)
    scheduler.historySaved()
    scheduler.historySaved()
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(4_999)
    expect(sync).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(sync).toHaveBeenCalledTimes(2)
    scheduler.historySaved()
    await vi.advanceTimersByTimeAsync(19_999)
    expect(sync).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(sync).toHaveBeenCalledTimes(3)
    scheduler.dispose()
  })

  it('does not immediately rerun queued history saves after an in-flight failure', async () => {
    let reject!: (error: Error) => void
    const sync = vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail }))
      .mockRejectedValue(new Error('network'))
    const { scheduler } = setup(sync)
    scheduler.retryNow()
    scheduler.historySaved()
    await vi.advanceTimersByTimeAsync(2_000)
    reject(new Error('initial failure'))
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(9_999)
    expect(sync).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(sync).toHaveBeenCalledTimes(2)
    scheduler.dispose()
  })
})
