const OpenAI = require('openai')

const createOpenRouterAdapter = () => {
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  const chat = async (messages, options = {}) => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('OpenRouter not configured, using mock response')
      return {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  block_type: 'content_block',
                  content_data: {
                    heading: 'Mock Term',
                    body: 'This is a mock response. Configure OPENROUTER_API_KEY for real AI extraction.',
                  },
                },
              ]),
            },
          },
        ],
      }
    }

    try {
      const response = await client.chat.completions.create({
        model: options.model || 'openai/gpt-4',
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 4000,
      })
      return response
    } catch (error) {
      console.error('OpenRouter error:', error)
      throw new Error('AI extraction failed')
    }
  }

  const extractStudyBlocks = async (text) => {
    const systemPrompt = `You are an academic study guide extractor. Extract study blocks from the provided text.
Return a JSON array of blocks with the following structure:
[
  {
    "block_type": "topic_banner",
    "content_data": { "heading": "Topic Name" }
  },
  {
    "block_type": "content_block",
    "content_data": { "heading": "Term", "body": "Definition" }
  }
]

Block types:
- topic_banner: Main topic headers
- sub_topic_banner: Sub-topic headers
- content_block: Term-definition pairs
- table: Table data with headers and rows`

    const response = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract study blocks from this text:\n\n${text}` },
    ])

    const content = response.choices[0].message.content
    return JSON.parse(content)
  }

  return { chat, extractStudyBlocks }
}

module.exports = { createOpenRouterAdapter }
