import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrismaInstance } = vi.hoisted(() => ({
  mockPrismaInstance: {
    save: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../../../config/database.js', () => ({ prisma: mockPrismaInstance }))

import * as saveModel from '../../../models/saveModel.js'

describe('Save Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch saved reviewers using the user relation', async () => {
    mockPrismaInstance.save.findMany.mockResolvedValue([])

    await saveModel.findByUser('user-123')

    expect(mockPrismaInstance.save.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        include: expect.objectContaining({
          reviewer: expect.objectContaining({
            select: expect.objectContaining({
              user: expect.objectContaining({
                select: expect.objectContaining({ displayName: true }),
              }),
            }),
          }),
        }),
      })
    )
  })

  it('should report whether a user saved a reviewer', async () => {
    mockPrismaInstance.save.findUnique.mockResolvedValue({ userId: 'user-123', reviewerId: 'r1' })

    await expect(saveModel.hasUserSaved('user-123', 'r1')).resolves.toBe(true)

    mockPrismaInstance.save.findUnique.mockResolvedValue(null)

    await expect(saveModel.hasUserSaved('user-123', 'r1')).resolves.toBe(false)
  })

  it('should batch-resolve which candidate reviewers are saved', async () => {
    mockPrismaInstance.save.findMany.mockResolvedValue([{ reviewerId: 'r1' }])

    const saved = await saveModel.savedReviewerIdsFor('user-123', ['r1', 'r2'])

    expect(saved).toEqual(new Set(['r1']))
    expect(mockPrismaInstance.save.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', reviewerId: { in: ['r1', 'r2'] } },
      select: { reviewerId: true },
    })
  })

  it('should skip the saved-status batch query when there are no candidates', async () => {
    const saved = await saveModel.savedReviewerIdsFor('user-123', [])

    expect(saved).toEqual(new Set())
    expect(mockPrismaInstance.save.findMany).not.toHaveBeenCalled()
  })
})
