import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractStudyBlocks, getMockExtraction, isConfigured } from '../../../services/openaiService.js'

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    block_type: 'topic_banner',
                    content_data: { heading: 'Test Topic' },
                  },
                  {
                    block_type: 'content_block',
                    content_data: { heading: 'Term', body: 'Definition' },
                  },
                ]),
              },
            },
          ],
        }),
      },
    },
  })),
}))

describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.OPENROUTER_API_KEY
  })

  describe('isConfigured', () => {
    it('should return false when not configured', () => {
      expect(isConfigured()).toBe(false)
    })

    it('should return true when configured', () => {
      process.env.OPENROUTER_API_KEY = 'test-key'
      expect(isConfigured()).toBe(true)
    })
  })

  describe('getMockExtraction', () => {
    it('should extract blocks from text', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const blocks = getMockExtraction(text)

      expect(Array.isArray(blocks)).toBe(true)
      expect(blocks.length).toBeGreaterThan(0)
    })

    it('should create topic banner for non-empty text', () => {
      const text = 'Some content here'
      const blocks = getMockExtraction(text)

      expect(blocks[0].block_type).toBe('topic_banner')
    })

    it('should create content blocks from lines', () => {
      const text = 'First line\nSecond line\nThird line'
      const blocks = getMockExtraction(text)

      const contentBlocks = blocks.filter((b) => b.block_type === 'content_block')
      expect(contentBlocks.length).toBeGreaterThan(0)
    })

    it('should handle empty text', () => {
      const blocks = getMockExtraction('')
      expect(blocks).toEqual([])
    })
  })

  describe('extractStudyBlocks', () => {
    it('should return mock data when not configured', async () => {
      const blocks = await extractStudyBlocks('Test content')

      expect(Array.isArray(blocks)).toBe(true)
    })

    it('should use OpenRouter when configured', async () => {
      process.env.OPENROUTER_API_KEY = 'test-key'

      const blocks = await extractStudyBlocks('Test content')

      expect(Array.isArray(blocks)).toBe(true)
    })
  })
})
