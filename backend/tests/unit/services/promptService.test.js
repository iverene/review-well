import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildExtractionPrompt, buildSummaryPrompt, EXTRACT_SYSTEM_PROMPT } from '../../../services/promptService.js'

describe('Prompt Service', () => {
  describe('buildExtractionPrompt', () => {
    it('should build prompt with basic text', () => {
      const result = buildExtractionPrompt('Test content')

      expect(result.system).toBe(EXTRACT_SYSTEM_PROMPT)
      expect(result.user).toContain('Test content')
    })

    it('should include context in prompt', () => {
      const result = buildExtractionPrompt('Test content', {
        courseCode: 'MATH 101',
        courseDescription: 'Introduction to Math',
        examType: 'midterm',
      })

      expect(result.user).toContain('MATH 101')
      expect(result.user).toContain('Introduction to Math')
      expect(result.user).toContain('midterm')
    })

    it('should handle missing context', () => {
      const result = buildExtractionPrompt('Test content', {})

      expect(result.user).toContain('Test content')
      expect(result.user).not.toContain('Course:')
    })
  })

  describe('buildSummaryPrompt', () => {
    it('should build summary prompt', () => {
      const result = buildSummaryPrompt('Long text to summarize')

      expect(result.system).toContain('summarize')
      expect(result.user).toContain('Long text to summarize')
    })
  })

  describe('EXTRACT_SYSTEM_PROMPT', () => {
    it('should contain JSON format instructions', () => {
      expect(EXTRACT_SYSTEM_PROMPT).toContain('JSON')
      expect(EXTRACT_SYSTEM_PROMPT).toContain('block_type')
      expect(EXTRACT_SYSTEM_PROMPT).toContain('content_data')
    })

    it('should list all block types', () => {
      expect(EXTRACT_SYSTEM_PROMPT).toContain('topic_banner')
      expect(EXTRACT_SYSTEM_PROMPT).toContain('sub_topic_banner')
      expect(EXTRACT_SYSTEM_PROMPT).toContain('content_block')
      expect(EXTRACT_SYSTEM_PROMPT).toContain('table')
    })
  })
})
