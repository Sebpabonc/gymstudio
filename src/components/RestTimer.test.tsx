import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RestTimer from './RestTimer'

const mocks = vi.hoisted(() => ({
  minimized: false,
  language: 'en',
  effects: [] as (() => void | (() => void))[],
  setMinimized: vi.fn(),
  fire: vi.fn(),
}))
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useState: (value: unknown) => typeof value === 'boolean'
      ? [mocks.minimized, mocks.setMinimized]
      : [value, vi.fn()],
    useRef: (value: unknown) => ({ current: value }),
    useEffect: (effect: () => void | (() => void)) => { mocks.effects.push(effect) },
  }
})
vi.mock('../i18n', () => ({
  useT: () => ({
    language: mocks.language,
    t: (key: string) => ({
      'rest.done': mocks.language === 'es' ? 'Ya' : 'Go',
      'rest.title': mocks.language === 'es' ? 'Descanso' : 'Rest',
      'rest.hide': mocks.language === 'es' ? 'Ocultar' : 'Hide',
      'rest.open': mocks.language === 'es' ? 'Abrir' : 'Open',
      'rest.startNext': mocks.language === 'es' ? 'Empezar la siguiente serie' : 'Start next set now',
      'rest.undo': 'Undo',
      'rest.add15': '+15s',
      'rest.skip': 'Skip',
    }[key] || key),
  }),
}))
vi.mock('../native/restAlerts', () => ({
  fireRestAlert: mocks.fire,
}))

function button(element: React.ReactNode, text: string): React.ReactElement {
  if (React.isValidElement(element)) {
    if (element.type === 'button' && element.props.children === text) return element
    for (const child of React.Children.toArray(element.props.children)) {
      try { return button(child, text) } catch { /* Search sibling nodes. */ }
    }
  }
  throw new Error(`Button not found: ${text}`)
}

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    mocks.effects = []
    mocks.minimized = false
    mocks.language = 'en'
    vi.clearAllMocks()
    vi.stubGlobal('window', globalThis)
    vi.stubGlobal('document', { body: { classList: { add: vi.fn(), remove: vi.fn() } } })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders a big rest popup with logged values, next target and insight', () => {
    const html = renderToStaticMarkup(
      <RestTimer timer={{ endAt: 121_000 }} hidden={false} onChange={vi.fn()} workoutMode
        label="✓ Set 1 logged · 35 kg × 8" nextLabel="Next: Set 2 · 32.5 kg × 10">
        <p>Next-set insight</p>
      </RestTimer>
    )
    expect(html).toContain('role="dialog"')
    expect(html).toContain('>Rest</strong>')
    expect(html).toContain('>2:00</div>')
    expect(html).toContain('35 kg × 8')
    expect(html).toContain('Next: Set 2 · 32.5 kg × 10')
    expect(html).toContain('Next-set insight')
    expect(html).toContain('Start next set now')
  })

  it('M3/T139: shows green Go and Undo, alerts once, then dismisses after three seconds without logging', () => {
    const onChange = vi.fn()
    const onUndo = vi.fn()
    const tree = RestTimer({ timer: { endAt: 1000 }, hidden: false, onChange, onUndo, workoutMode: true })
    const html = renderToStaticMarkup(tree!)
    expect(html).toContain('>Go</div>')
    expect(html).toContain('>Undo</button>')
    expect(html).toContain('workout-rest-popup done')
    const cleanups = mocks.effects.map(effect => effect())
    vi.advanceTimersByTime(2999)
    expect(onChange).not.toHaveBeenCalled()
    expect(onUndo).not.toHaveBeenCalled()
    expect(mocks.fire).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(null)
    button(tree, 'Undo').props.onClick()
    expect(onUndo).toHaveBeenCalledOnce()
    button(tree, 'Start next set now').props.onClick()
    expect(onChange).toHaveBeenCalledWith(null)
    cleanups.forEach(cleanup => { if (cleanup) cleanup() })
  })

  it('m4: tapping outside minimizes the popup but tapping inside does not', () => {
    const tree = RestTimer({ timer: { endAt: 121_000 }, hidden: false, onChange: vi.fn(), workoutMode: true })!
    const target = {}
    tree.props.onClick({ target, currentTarget: {} })
    expect(mocks.setMinimized).not.toHaveBeenCalled()
    tree.props.onClick({ target, currentTarget: target })
    expect(mocks.setMinimized).toHaveBeenCalledWith(true)
  })

  it('M3: minimized rest also shows Go and clears without invoking Undo', () => {
    mocks.minimized = true
    const onChange = vi.fn()
    const onUndo = vi.fn()
    const tree = RestTimer({ timer: { endAt: 1000 }, hidden: false, onChange, onUndo, workoutMode: true })
    expect(renderToStaticMarkup(tree!)).toContain('workout-rest-bar done')
    const cleanups = mocks.effects.map(effect => effect())
    vi.advanceTimersByTime(3000)
    expect(onChange).toHaveBeenCalledWith(null)
    expect(onUndo).not.toHaveBeenCalled()
    cleanups.forEach(cleanup => { if (cleanup) cleanup() })
  })

  it('extends from zero and Hide/Open only toggle visibility', () => {
    const onChange = vi.fn()
    const tree = RestTimer({ timer: { endAt: 500 }, hidden: false, onChange, workoutMode: true })
    button(tree, '+15s').props.onClick()
    expect(onChange).toHaveBeenCalledWith({ endAt: 16_000 })
    button(tree, 'Hide').props.onClick()
    expect(mocks.setMinimized).toHaveBeenCalledWith(true)
    mocks.minimized = true
    const bar = RestTimer({ timer: { endAt: 121_000 }, hidden: false, onChange, workoutMode: true, nextLabel: 'Next: Press' })
    expect(renderToStaticMarkup(bar!)).toContain('workout-rest-bar')
    expect(renderToStaticMarkup(bar!)).toContain('Next: Press')
    button(bar, 'Open').props.onClick()
    expect(mocks.setMinimized).toHaveBeenCalledWith(false)
  })

  it('localizes rest popup labels and keeps the non-workout dock', () => {
    mocks.language = 'es'
    expect(renderToStaticMarkup(<RestTimer timer={{ endAt: 121_000 }} hidden={false} onChange={vi.fn()} workoutMode />))
      .toContain('Descanso')
    expect(renderToStaticMarkup(<RestTimer timer={{ endAt: 121_000 }} hidden={false} onChange={vi.fn()} />))
      .toContain('rest-timer-pill')
    expect(renderToStaticMarkup(<RestTimer timer={{ endAt: 121_000 }} hidden onChange={vi.fn()} workoutMode />))
      .toBe('')
  })
})
