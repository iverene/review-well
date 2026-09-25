import { describe, it, expect } from 'vitest'

import { formatExamType } from '../../src/utils/examType'

describe('formatExamType', () => {
  it('maps stored values to display labels', () => {
    expect(formatExamType('prelim')).toBe('Prelim')
    expect(formatExamType('midterm')).toBe('Midterm')
    expect(formatExamType('final')).toBe('Finals')
    expect(formatExamType('quiz')).toBe('Quiz')
  })

  it('passes unknown values through unchanged', () => {
    expect(formatExamType('quarterly')).toBe('quarterly')
    expect(formatExamType(null)).toBeNull()
  })
})
