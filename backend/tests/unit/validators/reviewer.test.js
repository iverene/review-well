import { describe, it, expect } from 'vitest'

import { createReviewerSchema, updateReviewerSchema } from '../../../validators/reviewer.js'

const base = {
  title: 'Intro Quiz Guide',
  courseDescription: 'Intro course',
  semester: '1st Semester',
  examType: 'quiz',
}

describe('reviewer validators', () => {
  it('accepts a missing course code (defaults to empty string)', () => {
    const parsed = createReviewerSchema.parse({ ...base })
    expect(parsed.courseCode).toBe('')
  })

  it('accepts quiz as an exam type', () => {
    expect(createReviewerSchema.parse({ ...base, courseCode: 'CS 101' }).examType).toBe('quiz')
    expect(updateReviewerSchema.parse({ examType: 'quiz' }).examType).toBe('quiz')
  })

  it('rejects unknown exam types', () => {
    expect(() => createReviewerSchema.parse({ ...base, courseCode: 'CS 101', examType: 'pop' })).toThrow()
  })
})
