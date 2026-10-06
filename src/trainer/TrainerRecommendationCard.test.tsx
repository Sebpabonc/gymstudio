import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import TrainerRecommendationCard from './TrainerRecommendationCard'

const props = {
  title: 'AI Trainer',
  lastTime: 'Last time: 10 kg × 14 · 14 · 14',
  original: 'Original today: 10 kg × 12',
  recommended: 'Recommended: 12 kg × 10–12',
  why: 'Last time you did 14 reps at 10 kg; the target was 10.',
  confidence: 'Medium confidence',
  collectData: false,
  sameAsOriginal: false,
  acceptLabel: 'Accept',
  keepOriginalLabel: 'Keep original',
  collectDataText: 'Not enough data yet — keep the load so I can set a baseline.',
  sameAsOriginalText: 'Recommendation matches the original.',
  onAccept: vi.fn(),
  onKeepOriginal: vi.fn(),
}

function findButton(node: React.ReactNode, text: string): React.ReactElement | undefined {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findButton(item, text)
      if (found) return found
    }
  }
  if (!React.isValidElement(node)) return undefined
  if (node.type === 'button' && node.props.children === text) return node
  return findButton(node.props.children, text)
}

describe('TrainerRecommendationCard', () => {
  it('shows an increase recommendation and lets the user accept it', () => {
    const card = TrainerRecommendationCard(props)
    const html = renderToString(card)

    expect(html).toContain('Recommended: 12 kg × 10–12')
    expect(html).toContain('Accept')
    expect(html).toContain('Keep original')
    findButton(card, 'Accept')?.props.onClick()
    expect(props.onAccept).toHaveBeenCalledOnce()
  })

  it('uses one line and no buttons when the recommendation matches the original', () => {
    const card = <TrainerRecommendationCard {...props} sameAsOriginal />
    const html = renderToString(card)

    expect(html).toContain('Recommendation matches the original.')
    expect(html).not.toContain('Accept')
    expect(html).not.toContain('Keep original')
  })

  it('shows the collect-data baseline message without choice buttons', () => {
    const html = renderToString(<TrainerRecommendationCard {...props} collectData />)

    expect(html).toContain('Not enough data yet — keep the load so I can set a baseline.')
    expect(html).not.toContain('Accept')
    expect(html).not.toContain('Keep original')
  })
})
