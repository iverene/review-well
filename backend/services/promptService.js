const EXTRACT_SYSTEM_PROMPT = `You are an academic study guide extractor. Your task is to extract study blocks from educational content.

You must return a JSON array of blocks with the following structure:
[
  {
    "block_type": "topic_banner",
    "content_data": { "heading": "Topic Name" }
  },
  {
    "block_type": "sub_topic_banner",
    "content_data": { "heading": "Sub-topic Name" }
  },
  {
    "block_type": "content_block",
    "content_data": { "heading": "Term or Concept", "body": "Definition or explanation" }
  },
  {
    "block_type": "table",
    "content_data": { "headers": ["Column1", "Column2"], "rows": [["Value1", "Value2"]] }
  }
]

Rules:
1. Extract ALL important concepts, terms, and definitions
2. Organize content into logical topics and sub-topics
3. Create content blocks for term-definition pairs
4. Create tables for comparative data or structured information
5. Preserve the original meaning and context
6. Use clear, concise language
7. Return ONLY valid JSON, no additional text`

const buildExtractionPrompt = (text, context = {}) => {
  const { courseCode, courseDescription, examType } = context

  let userPrompt = 'Extract study blocks from the following content:\n\n'

  if (courseCode) {
    userPrompt += `Course: ${courseCode}\n`
  }
  if (courseDescription) {
    userPrompt += `Description: ${courseDescription}\n`
  }
  if (examType) {
    userPrompt += `Exam Type: ${examType}\n`
  }

  userPrompt += `\nContent:\n${text}`

  return {
    system: EXTRACT_SYSTEM_PROMPT,
    user: userPrompt,
  }
}

const buildSummaryPrompt = (text) => {
  return {
    system: 'You are a helpful assistant that summarizes academic content.',
    user: `Summarize the following content in 2-3 sentences:\n\n${text}`,
  }
}

module.exports = {
  EXTRACT_SYSTEM_PROMPT,
  buildExtractionPrompt,
  buildSummaryPrompt,
}
