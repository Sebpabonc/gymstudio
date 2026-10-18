import { getSyncRetryDelay, SyncSignInRequiredError } from '../utils/sync'

type SyncSchedulerOptions = {
  sync: () => Promise<void>
  isOnline: () => boolean
  onOffline: () => void
  onError: (error: unknown) => void
}

/** One account's sync loop. Disposal also ignores an in-flight account's result. */
export function createSyncScheduler(options: SyncSchedulerOptions) {
  let active = true
  let running = false
  let rerun = false
  let rerunImmediately = false
  let waitingForRetry = false
  let failures = 0
  let signInRequired = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    waitingForRetry = false
  }

  const schedule = (delay: number, retry = false) => {
    clearTimer()
    waitingForRetry = retry
    timer = setTimeout(() => {
      timer = undefined
      waitingForRetry = false
      void run()
    }, delay)
  }

  const run = async (immediate = false) => {
    if (!active) return
    clearTimer()
    if (!options.isOnline()) {
      options.onOffline()
      return
    }
    if (running) {
      rerun = true
      rerunImmediately ||= immediate
      return
    }
    running = true
    try {
      await options.sync()
      failures = 0
      signInRequired = false
    } catch (error) {
      if (active) {
        options.onError(error)
        signInRequired = error instanceof SyncSignInRequiredError
        if (!options.isOnline()) options.onOffline()
        else if (!signInRequired) schedule(getSyncRetryDelay(++failures), true)
        // A save queued during a failing request must not bypass its backoff.
        rerun = rerunImmediately && !signInRequired
      }
    } finally {
      running = false
      if (active && rerun) {
        rerun = false
        const immediate = rerunImmediately
        rerunImmediately = false
        void run(immediate)
      } else {
        rerunImmediately = false
      }
    }
  }

  return {
    retryNow: () => {
      signInRequired = false
      failures = 0
      void run(true)
    },
    historySaved: () => {
      if (!active || signInRequired || waitingForRetry) return
      if (!options.isOnline()) options.onOffline()
      else if (running) rerun = true
      else schedule(2_000)
    },
    online: () => {
      if (!signInRequired) void run(true)
    },
    offline: () => {
      clearTimer()
      if (active) options.onOffline()
    },
    dispose: () => {
      active = false
      clearTimer()
    },
  }
}
