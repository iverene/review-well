import OpenAI from 'openai'
import { buildExtractionPrompt, buildDeckPrompt } from './promptService.js'

const MAX_DECK_CARDS = 40
const MAX_DECK_PROMPTS = 5

let client = null

const getClient = () => {
  if (!client && process.env.OPENROUTER_API_KEY) {
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })
  }
  return client
}

const extractStudyBlocks = async (text, context = {}) => {
  const openai = getClient()

  if (!openai) {
    console.log('OpenRouter not configured, returning mock data')
    return getMockExtraction(text)
  }

  const { system, user } = buildExtractionPrompt(text, context)

  try {
    const response = await openai.chat.completions.create({
      model: context.model || 'openai/gpt-4',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    const parsed = JSON.parse(content)

    // Ensure we return an array
    return Array.isArray(parsed) ? parsed : parsed.blocks || []
  } catch (error) {
    console.error('OpenRouter extraction error:', error)
    throw new Error('Failed to extract study blocks')
  }
}

const getMockExtraction = (text) => {
  // Simple mock extraction for testing/development
  const lines = text.split('\n').filter((line) => line.trim())
  const blocks = []

  if (lines.length > 0) {
    blocks.push({
      block_type: 'topic_banner',
      content_data: { heading: 'Extracted Content' },
    })
  }

  // Create content blocks from lines
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim()
    if (line.length > 5) {
      blocks.push({
        block_type: 'content_block',
        content_data: {
          heading: line.substring(0, 50),
          body: line.substring(0, 200),
        },
      })
    }
  }

  return blocks
}

const isConfigured = () => {
  return !!process.env.OPENROUTER_API_KEY
}

const capDeck = (cards = [], prompts = []) => {
  const trimmedCards = cards.slice(0, MAX_DECK_CARDS)
  const trimmedPrompts = prompts.slice(0, MAX_DECK_PROMPTS)
  const trimmed = cards.length > MAX_DECK_CARDS || prompts.length > MAX_DECK_PROMPTS
  return { cards: trimmedCards, prompts: trimmedPrompts, trimmed }
}

const isValidCard = (card) => (
  card
  && typeof card.front === 'string'
  && typeof card.back === 'string'
  && card.front.trim().length > 0
  && card.back.trim().length > 0
)

const isValidPrompt = (prompt) => (
  typeof prompt === 'string' && prompt.trim().length > 0
)

const getMockDeck = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 5)
  const cards = lines.slice(0, 10).map((line) => ({
    front: line.substring(0, 50),
    back: line.substring(0, 200),
  }))
  const prompts = lines.length > 0
    ? ['Explain the key ideas from this material in your own words.']
    : []
  return { ...capDeck(cards, prompts), partial: false }
}

const parseDeckContent = (content) => {
  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    const parseError = new Error('Failed to parse deck JSON')
    parseError.code = 'DECK_PARSE_FAILED'
    throw parseError
  }

  const rawCards = Array.isArray(parsed) ? parsed : parsed.cards || parsed.flashcards || []
  const rawPrompts = Array.isArray(parsed) ? [] : parsed.prompts || []
  const cards = (Array.isArray(rawCards) ? rawCards : []).filter(isValidCard)
  const prompts = (Array.isArray(rawPrompts) ? rawPrompts : []).filter(isValidPrompt)
  const partial = cards.length < rawCards.length || prompts.length < rawPrompts.length

  return { ...capDeck(cards, prompts), partial }
}

const extractDeckAndPrompts = async (text, context = {}) => {
  const openai = getClient()

  if (!openai) {
    console.log('OpenRouter not configured, returning mock deck')
    return getMockDeck(text)
  }

  const { system, user } = buildDeckPrompt(text, context)

  let response
  try {
    response = await openai.chat.completions.create({
      model: context.model || 'openai/gpt-4',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })
  } catch (error) {
    console.error('OpenRouter deck extraction error:', error)
    const llmError = new Error('AI deck generation failed')
    llmError.code = /timeout|timed out|abort|ETIMEDOUT|ECONNABORTED/i.test(error.message || '')
      ? 'DECK_TIMEOUT'
      : 'DECK_LLM_FAILED'
    throw llmError
  }

  const content = response.choices[0].message.content
  return parseDeckContent(content)
}

export { extractStudyBlocks, getMockExtraction, isConfigured, extractDeckAndPrompts, capDeck, MAX_DECK_CARDS, MAX_DECK_PROMPTS }