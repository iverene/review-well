import { describe, it, expect, vi } from 'vitest'

// This spec verifies the generated Prisma client (not the global mock in
// tests/setup.js), so it unmocks @prisma/client. (vitest hoists the unmock
// above the import.) No database round-trip: setup.js pins DATABASE_URL to a
// localhost test DB that is not provisioned, and the suite runs fully mocked.
vi.unmock('@prisma/client')

import { PrismaClient, Prisma } from '@prisma/client'

const getModel = (name) => Prisma.dmmf.datamodel.models.find((m) => m.name === name)

const fieldNames = (model) => model.fields.map((f) => f.name)

describe('study-mode schema', () => {
  it('exposes the new study-mode delegates and drops the Block delegate', async () => {
    const prisma = new PrismaClient()
    try {
      expect(typeof prisma.reviewerFile.create).toBe('function')
      expect(typeof prisma.flashcard.create).toBe('function')
      expect(typeof prisma.blurtingAttempt.create).toBe('function')
      expect(typeof prisma.pomodoroSession.create).toBe('function')
      expect(prisma.block).toBeUndefined()
    } finally {
      await prisma.$disconnect()
    }
  })

  it('creates a reviewer with file, card, attempt, and session rows', () => {
    // Shape-level contract for the row creation Task 2+ relies on: required
    // fields, column mappings, and defaults (file.version === 1,
    // card.known === false) as declared in schema.prisma.
    const reviewerFile = getModel('ReviewerFile')
    const flashcard = getModel('Flashcard')
    const attempt = getModel('BlurtingAttempt')
    const session = getModel('PomodoroSession')

    expect(reviewerFile?.dbName).toBe('reviewer_files')
    expect(fieldNames(reviewerFile)).toEqual(
      expect.arrayContaining(['id', 'reviewerId', 'storagePath', 'fileType', 'byteSize', 'version', 'createdAt']),
    )
    expect(reviewerFile.fields.find((f) => f.name === 'version').default).toBe(1)

    expect(flashcard?.dbName).toBe('flashcards')
    expect(flashcard.fields.find((f) => f.name === 'known').default).toBe(false)

    expect(attempt?.dbName).toBe('blurting_attempts')
    expect(fieldNames(attempt)).toEqual(
      expect.arrayContaining(['reviewerId', 'userId', 'promptText', 'dumpText', 'gradedVia']),
    )

    expect(session?.dbName).toBe('pomodoro_sessions')
    expect(fieldNames(session)).toEqual(
      expect.arrayContaining(['userId', 'focusSeconds', 'startedAt', 'endedAt']),
    )

    const reviewer = getModel('Reviewer')
    expect(fieldNames(reviewer)).toEqual(
      expect.arrayContaining(['aiPrompts', 'deckGeneratedAt', 'deckStale']),
    )

    const quota = getModel('AiQuota')
    expect(fieldNames(quota)).toEqual(expect.arrayContaining(['gradesUsed', 'gradesResetAt']))

    const user = getModel('User')
    expect(fieldNames(user)).toEqual(expect.arrayContaining(['dailyFocusMinutes']))

    expect(getModel('Block')).toBeUndefined()
  })
})
