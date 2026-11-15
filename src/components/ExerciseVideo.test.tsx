import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExerciseVideo, { ExerciseVideoPlayer, SLOW_PLAYBACK_RATE, shouldPlayTile, type ExerciseVideoLabels } from './ExerciseVideo'

const harness = vi.hoisted(() => ({
  active: false,
  cursor: 0,
  slots: [] as any[],
  effects: [] as (() => void | (() => void))[],
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useState: (initial: any) => {
      if (!harness.active) return actual.useState(initial)
      const index = harness.cursor++
      if (!(index in harness.slots)) harness.slots[index] = typeof initial === 'function' ? initial() : initial
      return [harness.slots[index], (next: any) => {
        harness.slots[index] = typeof next === 'function' ? next(harness.slots[index]) : next
      }]
    },
    useRef: (initial: any) => {
      if (!harness.active) return actual.useRef(initial)
      const index = harness.cursor++
      return harness.slots[index] ??= { current: initial }
    },
    useCallback: (callback: any, deps: any[]) => harness.active ? callback : actual.useCallback(callback, deps),
    useEffect: (effect: () => void | (() => void), deps?: any[]) => {
      if (!harness.active) return actual.useEffect(effect, deps)
      const index = harness.cursor++
      const previous = harness.slots[index]
      if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous[i]))) harness.effects.push(effect)
      harness.slots[index] = deps
    },
  }
})
vi.mock('react-dom', async () => ({
  ...await vi.importActual<typeof import('react-dom')>('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}))
vi.mock('../utils/useBodyScrollLock', () => ({ useBodyScrollLock: () => undefined }))

const video = { src: 'exercise-videos/incline-dumbbell-press.mp4', poster: 'exercise-videos/incline-dumbbell-press.jpg', model: 'Seb' }
const labels: ExerciseVideoLabels = {
  open: 'Watch technique video: Incline press', close: 'Close video', normal: 'Normal', slow: 'Slow 0.5×',
  badge: 'Technique', cue: 'Squeeze',
}

function hooked<T>(render: () => T): T {
  harness.cursor = 0
  harness.active = true
  try { return render() } finally { harness.active = false }
}

function runEffects() {
  for (const effect of harness.effects.splice(0)) effect()
}

function find(root: React.ReactNode, predicate: (node: React.ReactElement) => boolean): React.ReactElement[] {
  const found: React.ReactElement[] = []
  const visit = (node: React.ReactNode) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (!React.isValidElement(node)) return
    if (predicate(node)) found.push(node)
    visit((node.props as { children?: React.ReactNode }).children)
  }
  visit(root)
  return found
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: reduce }), addEventListener: vi.fn(), removeEventListener: vi.fn() })
}

beforeEach(() => {
  harness.slots = []
  harness.effects = []
  stubReducedMotion(false)
})

afterEach(() => {
  harness.active = false
  vi.unstubAllGlobals()
})

describe('ExerciseVideo tile (#442)', () => {
  it('renders a silent looping 16:10 tile that does not load until visible', () => {
    const html = renderToStaticMarkup(<ExerciseVideo video={video} title="Incline press" labels={labels} active />)
    expect(html).toContain('class="exercise-video"')
    expect(html).toContain('aria-label="Watch technique video: Incline press"')
    expect(html).toContain('src="exercise-videos/incline-dumbbell-press.mp4"')
    expect(html).toContain('poster="exercise-videos/incline-dumbbell-press.jpg"')
    expect(html).toMatch(/<video[^>]*muted=""/)
    expect(html).toMatch(/<video[^>]*loop=""/)
    expect(html).toMatch(/<video[^>]*playsinline=""/i)
    expect(html).toContain('preload="none"')
    expect(html).not.toContain('autoplay')
    expect(html).not.toContain('exercise-video-badge')
  })

  it('reduced motion shows the poster with a play badge and never autoplays', () => {
    stubReducedMotion(true)
    const html = renderToStaticMarkup(<ExerciseVideo video={video} title="Incline press" labels={labels} active />)
    expect(html).toContain('exercise-video exercise-video-still')
    expect(html).toContain('exercise-video-badge')
    expect(html).toContain('Technique')
    expect(html).toContain('preload="none"')
    expect(html).not.toContain('autoplay')
  })

  it('plays only when it is the active card, on screen, with motion allowed and the player closed', () => {
    expect(shouldPlayTile(true, true, false, false)).toBe(true)
    expect(shouldPlayTile(false, true, false, false)).toBe(false)
    expect(shouldPlayTile(true, false, false, false)).toBe(false)
    expect(shouldPlayTile(true, true, true, false)).toBe(false)
    expect(shouldPlayTile(true, true, false, true)).toBe(false)
  })

  it('starts playing when scrolled into view and pauses when scrolled away or no longer active', () => {
    let observerCallback: (entries: Array<{ isIntersecting: boolean }>) => void = () => undefined
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: typeof observerCallback) { observerCallback = callback }
      observe() {}
      disconnect() {}
    })
    const element = { muted: false, play: vi.fn(() => Promise.resolve()), pause: vi.fn() }
    const render = (active: boolean) => hooked(() => ExerciseVideo({ video, title: 'Incline press', labels, active }))
    render(true)
    harness.slots[0].current = {}
    harness.slots[1].current = element
    runEffects()
    expect(element.play).not.toHaveBeenCalled()
    expect(element.muted).toBe(true)

    observerCallback([{ isIntersecting: true }])
    render(true)
    runEffects()
    expect(element.play).toHaveBeenCalledTimes(1)

    observerCallback([{ isIntersecting: false }])
    render(true)
    runEffects()
    expect(element.pause).toHaveBeenCalled()

    observerCallback([{ isIntersecting: true }])
    render(true)
    runEffects()
    expect(element.play).toHaveBeenCalledTimes(2)
    element.pause.mockClear()
    render(false)
    runEffects()
    expect(element.pause).toHaveBeenCalled()
  })

  it('hides itself when the clip fails to load', () => {
    const tree = hooked(() => ExerciseVideo({ video, title: 'Incline press', labels, active: true }))
    const media = find(tree, node => node.type === 'video')[0]
    media.props.onError()
    expect(hooked(() => ExerciseVideo({ video, title: 'Incline press', labels, active: true }))).toBeNull()
  })

  it('opens the full-screen player on tap and returns focus to the tile on close', () => {
    const tree = hooked(() => ExerciseVideo({ video, title: 'Incline press', labels, cue: 'Squeeze upper chest', active: true }))
    const focus = vi.fn()
    harness.slots[0].current = { focus }
    find(tree, node => node.type === 'button')[0].props.onClick()
    const opened = hooked(() => ExerciseVideo({ video, title: 'Incline press', labels, cue: 'Squeeze upper chest', active: true }))
    const player = find(opened, node => node.type === ExerciseVideoPlayer)[0]
    expect(player.props.cue).toBe('Squeeze upper chest')
    player.props.onClose()
    expect(focus).toHaveBeenCalled()
    const closed = hooked(() => ExerciseVideo({ video, title: 'Incline press', labels, active: true }))
    expect(find(closed, node => node.type === ExerciseVideoPlayer)).toHaveLength(0)
  })
})

describe('ExerciseVideoPlayer (#442)', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { activeElement: null })
  })

  it('the speed toggle sets playbackRate to 0.5 and back to 1', () => {
    const element = { muted: false, playbackRate: 1 }
    const render = () => hooked(() => ExerciseVideoPlayer({ video, title: 'Incline press', labels, cue: 'Squeeze upper chest', onClose: vi.fn() }))
    let tree = render() as React.ReactElement
    harness.slots[1].current = element
    runEffects()
    expect(element.playbackRate).toBe(1)
    expect(element.muted).toBe(true)

    const button = (text: string) => find(tree, node => node.type === 'button' && node.props.children === text)[0]
    expect(button('Normal').props['aria-pressed']).toBe(true)
    button('Slow 0.5×').props.onClick()
    tree = render() as React.ReactElement
    runEffects()
    expect(element.playbackRate).toBe(SLOW_PLAYBACK_RATE)
    expect(button('Slow 0.5×').props['aria-pressed']).toBe(true)

    button('Normal').props.onClick()
    tree = render() as React.ReactElement
    runEffects()
    expect(element.playbackRate).toBe(1)
  })

  it('shows Close, the squeeze cue, a muted video, and closes on Escape', () => {
    const onClose = vi.fn()
    const listeners: Record<string, (event: { key: string; preventDefault: () => void }) => void> = {}
    vi.stubGlobal('window', { addEventListener: (type: string, fn: any) => { listeners[type] = fn }, removeEventListener: vi.fn() })
    const tree = hooked(() => ExerciseVideoPlayer({ video, title: 'Incline press', labels, cue: 'Squeeze upper chest', onClose })) as React.ReactElement
    runEffects()
    expect(tree.props.role).toBe('dialog')
    expect(find(tree, node => node.type === 'button' && node.props['aria-label'] === 'Close video')).toHaveLength(1)
    const media = find(tree, node => node.type === 'video')[0]
    expect(media.props.muted).toBe(true)
    expect(media.props.loop).toBe(true)
    expect(media.props.playsInline).toBe(true)
    expect(renderToStaticMarkup(tree)).toContain('Squeeze upper chest')
    listeners.keydown({ key: 'Escape', preventDefault: vi.fn() })
    expect(onClose).toHaveBeenCalled()
  })

  it('leaves out the cue line when the exercise has none', () => {
    const tree = hooked(() => ExerciseVideoPlayer({ video, title: 'Incline press', labels, onClose: vi.fn() })) as React.ReactElement
    expect(find(tree, node => node.props.className === 'exercise-video-player-cue')).toHaveLength(0)
  })
})
