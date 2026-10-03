import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyWeightTarget, consumeWeightTarget, loadWeightTargets, removeWeightTarget } from './storage'
import { applyTargetToWeights, isTargetMet, targetAppliesToDay, targetWeightKg } from './weightTargets'

const target = { dayType: 'B' as const, increaseKg: 2.5, baseWeightKg: 40, appliedAt: '2026-01-01T00:00:00.000Z' }

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  })
})

describe('weight target storage', () => {
  it('stores, loads and removes targets', () => {
    applyWeightTarget('bench', { dayType: 'B', increaseKg: 2.5, baseWeightKg: 40 })
    expect(loadWeightTargets().bench).toMatchObject({ dayType: 'B', increaseKg: 2.5, baseWeightKg: 40 })
    expect(typeof loadWeightTargets().bench.appliedAt).toBe('string')
    expect(removeWeightTarget('bench')).toEqual({})
    expect(loadWeightTargets()).toEqual({})
  })

  it('consumes only when logged weights reach the target', () => {
    applyWeightTarget('bench', { dayType: 'B', increaseKg: 2.5, baseWeightKg: 40 })
    expect(consumeWeightTarget('bench', [{ weight: 40 }, { weight: 42 }]).bench).toBeDefined()
    expect(consumeWeightTarget('bench', [{ weight: 42.5 }])).toEqual({})
    expect(loadWeightTargets()).toEqual({})
  })
})

describe('prefill math', () => {
  it('adds the increase to every straight set', () => {
    expect(applyTargetToWeights([40, 40, 40], target)).toEqual([42.5, 42.5, 42.5])
  })

  it('adds the increase to every pyramid set', () => {
    expect(applyTargetToWeights([30, 35, 40], target)).toEqual([32.5, 37.5, 42.5])
  })

  it('increases the drop-set main part only and falls back to the base weight', () => {
    expect(applyTargetToWeights([0, 40], target)).toEqual([42.5, 42.5])
  })

  it('matches the day type', () => {
    expect(targetAppliesToDay(target, 'chest-back-b')).toBe(true)
    expect(targetAppliesToDay(target, 'chest-back-a')).toBe(false)
    expect(targetAppliesToDay(target, undefined)).toBe(true)
    expect(targetAppliesToDay(undefined, 'x-b')).toBe(false)
    expect(targetWeightKg(target)).toBe(42.5)
    expect(isTargetMet(target, [{ weight: 42.5 }])).toBe(true)
  })
})
