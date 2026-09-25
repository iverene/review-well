import { describe, it, expect } from 'vitest'

import { capDeck } from '../../../services/openaiService.js'

const makeCards = (n) =>
  Array.from({ length: n }, (_, i) => ({
    front: `Term ${i + 1}`,
    back: `Definition ${i + 1}`,
  }))

const makePrompts = (n) => Array.from({ length: n }, (_, i) => `Blurting prompt ${i + 1}`)

describe('capDeck', () => {
  it('trims 60 cards to 40 and 7 prompts to 5 with trimmed=true', () => {
    const { cards, prompts, trimmed } = capDeck(makeCards(60), makePrompts(7))

    expect(cards).toHaveLength(40)
    expect(prompts).toHaveLength(5)
    expect(trimmed).toBe(true)
  })

  it('keeps order when trimming (first 40 cards, first 5 prompts)', () => {
    const { cards, prompts } = capDeck(makeCards(60), makePrompts(7))

    expect(cards[0].front).toBe('Term 1')
    expect(cards[39].front).toBe('Term 40')
    expect(prompts[0]).toBe('Blurting prompt 1')
    expect(prompts[4]).toBe('Blurting prompt 5')
  })

  it('returns trimmed=false when within caps', () => {
    const { cards, prompts, trimmed } = capDeck(makeCards(3), makePrompts(2))

    expect(cards).toHaveLength(3)
    expect(prompts).toHaveLength(2)
    expect(trimmed).toBe(false)
  })
})
