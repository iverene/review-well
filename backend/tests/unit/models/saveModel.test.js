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
})
