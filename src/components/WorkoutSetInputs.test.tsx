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
    expect(html).toContain('type="number" inputMode="numeric" min="1"')
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
  ])('keeps raw %j while only updating finite, nonblank weights', (raw, numeric) => {
    const { props, inputs } = renderInputs()
    inputs[0].props.onChange?.({ target: { value: raw } } as React.ChangeEvent<HTMLInputElement>)

    expect(props.onWeightInputChange).toHaveBeenCalledWith(raw)
    if (numeric === undefined) expect(props.onValueChange).not.toHaveBeenCalled()
    else expect(props.onValueChange).toHaveBeenCalledWith('weight', numeric)
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

  it('preserves rep cleaning, one-rep steps, and the minimum of one', () => {
    const { props, inputs, buttons } = renderInputs({ reps: 1 })
    const event = { target: { value: '015' } } as React.ChangeEvent<HTMLInputElement>
    inputs[1].props.onChange?.(event)
    expect(event.target.value).toBe('15')
    expect(props.onValueChange).toHaveBeenLastCalledWith('reps', '15')
    buttons[2].props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(props.onValueChange).toHaveBeenLastCalledWith('reps', '1')
    buttons[3].props.onClick?.({} as React.MouseEvent<HTMLButtonElement>)
    expect(props.onValueChange).toHaveBeenLastCalledWith('reps', '2')
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
