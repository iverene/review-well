const OpenAI = require('openai')
const { buildExtractionPrompt } = require('./promptService')

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

module.exports = { extractStudyBlocks, getMockExtraction, isConfigured }
