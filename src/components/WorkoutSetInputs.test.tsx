import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createTranslator } from '../i18n/translate'
import WorkoutSetInputs, { type WorkoutSetInputsProps } from './WorkoutSetInputs'

function renderInputs(overrides: Partial<WorkoutSetInputsProps> = {}) {
  const props: WorkoutSetInputsProps = {
    setIndex: 1,
    weight: 12.5,
    weightInput: '12.',
    reps: 8,
    equipment: 'dumbbell',
    language: 'en',
    t: createTranslator('en'),
    repsLabel: 'reps',
    onWeightInputChange: vi.fn(),
    onValueChange: vi.fn(),
    ...overrides,
  }
  const element = WorkoutSetInputs(props)
  const inputs: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>[] = []
  const buttons: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>[] = []
  const visit = (node: React.ReactNode) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (!React.isValidElement(node)) return
    if (node.type === 'input') inputs.push(node as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>)
    if (node.type === 'button') buttons.push(node as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>)
    visit(node.props.children)
  }
  visit(element)
  return { props, element, inputs, buttons }
}

describe('WorkoutSetInputs', () => {
  it.each(['en', 'es'] as const)('preserves raw weight text and accessible set labels in %s', (language) => {
    const { props, element } = renderInputs({
      language, t: createTranslator(language), weightInput: '12,',
    })
    const html = renderToString(element)

    expect(html).toContain('class="workout-mode-big-inputs"')
    expect(html).toContain('type="text" inputMode="decimal"')
    expect(html).toContain('data-log-weight="true"')
    expect(html).toContain('value="12,"')
    expect(html).toContain('type="number" inputMode="numeric" min="0"')
    for (const key of [
      'workout.set.weightDecrease', 'workout.set.weightLabel', 'workout.set.weightIncrease',
      'workout.set.repsDecrease', 'workout.set.repsLabel', 'workout.set.repsIncrease',
    ] as const) {
      expect(html).toContain(`aria-label="${props.t(key, { set: 2 })}"`)
    }
  })

  it.each([
    ['12.', '12'], ['12,', '12'], ['12,5', '12.5'], ['0', '0'],
    ['', undefined], [' ', undefined], ['.', undefined], ['12,5,5', undefined], ['Infinity', undefined],
  ])('keeps raw %j and makes an invalid or empty weight unsaveable', (raw, numeric) => {
    const { props, inputs } = renderInputs()
    inputs[0].props.onChange?.({ target: { value: raw } } as React.ChangeEvent<HTMLInputElement>)

    expect(props.onWeightInputChange).toHaveBeenCalledWith(raw)
    expect(props.onValueChange).toHaveBeenCalledWith('weight', numeric ?? '0')
  })

  it.each([
    ['dumbbell', 'en', 12, '10', '14', '14'],
    ['dumbbell', 'en', 12.5, '11', '15', '15'],
    ['cable', 'es', 10, '7.5', '12.5', '12,5'],
    ['barbell', 'en', 0, '0', '2.5', '2.5'],
    [undefined, 'en', 10, '7.5', '12.5', '12.5'],
  ] as const)('keeps %s steps, zero floor, and %s formatting', (equipment, language, weight, lower, upper, formatted) => {
    const { props, buttons } = renderInputs({ equipment, language, weight })
    buttons[0].props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(props.onValueChange).toHaveBeenLastCalledWith('weight', lower)
    buttons[1].props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(props.onValueChange).toHaveBeenLastCalledWith('weight', upper)
    expect(props.onWeightInputChange).toHaveBeenLastCalledWith(formatted)
  })

  it('T124/T151: permits zero reps so Done disables or the drop is omitted', () => {
    const { props, inputs, buttons } = renderInputs({ reps: 1 })
    const event = { target: { value: '015' } } as React.ChangeEvent<HTMLInputElement>
    inputs[1].props.onChange?.(event)
    expect(event.target.value).toBe('15')
    expect(props.onValueChange).toHaveBeenLastCalledWith('reps', '15')
    buttons[2].props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(props.onValueChange).toHaveBeenLastCalledWith('reps', '0')
    buttons[3].props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(props.onValueChange).toHaveBeenLastCalledWith('reps', '2')
  })

  it.each(['en', 'es'] as const)('preserves an unfinished drop-weight decimal in %s until the next digit is typed', (language) => {
    let weight = 30
    let raw = '30'
    const separator = language === 'es' ? ',' : '.'
    const props = () => ({
      language, t: createTranslator(language), weight, weightInput: raw,
      weightLabel: createTranslator(language)('workout.set.dropWeightLabel', { set: 2 }),
      onWeightInputChange: (next: string) => { raw = next },
      onValueChange: (field: 'weight' | 'reps', next: string) => { if (field === 'weight') weight = Number(next) },
    })
    for (const value of ['12', `12${separator}`, `12${separator}5`]) {
      renderInputs(props()).inputs[0].props.onChange?.({ target: { value } } as React.ChangeEvent<HTMLInputElement>)
      expect(renderToString(renderInputs(props()).element)).toContain(`value="${value}"`)
    }
    expect(weight).toBe(12.5)
    expect(raw).toBe(`12${separator}5`)
  })

  it('selects the full weight and reps values on focus', () => {
    const { inputs } = renderInputs()
    for (const input of inputs) {
      const select = vi.fn()
      input.props.onFocus?.({ currentTarget: { select } } as unknown as React.FocusEvent<HTMLInputElement>)
      expect(select).toHaveBeenCalledOnce()
    }
  })
})
