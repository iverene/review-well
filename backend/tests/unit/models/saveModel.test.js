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
import { clearAll } from '../../../utils/cache.js'

describe('Save Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearAll()
  })

  it('should fetch saved reviewers using the user relation', async () => {
    mockPrismaInstance.save.findMany.mockResolvedValue([])

    await saveModel.findByUser('user-123')

    expect(mockPrismaInstance.save.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-123' }),
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

  it('should page saved reviewers and return the total', async () => {
    const saves = [{ reviewer: { id: 'r1' } }]
    mockPrismaInstance.save.findMany.mockResolvedValue(saves)
    mockPrismaInstance.save.count.mockResolvedValue(7)

    await expect(saveModel.findByUser('user-123', { skip: 20, take: 20 })).resolves.toEqual({
      saves,
      total: 7,
    })

    expect(mockPrismaInstance.save.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-123' }), skip: 20, take: 20 })
    )
    expect(mockPrismaInstance.save.count).toHaveBeenCalledWith({ where: expect.objectContaining({ userId: 'user-123' }) })
  })

  it('should cache saved reviewers per page', async () => {
    mockPrismaInstance.save.findMany.mockResolvedValue([])
    mockPrismaInstance.save.count.mockResolvedValue(0)

    await saveModel.findByUser('user-123', { skip: 0, take: 20 })
    await saveModel.findByUser('user-123', { skip: 20, take: 20 })

    expect(mockPrismaInstance.save.findMany).toHaveBeenCalledTimes(2)
    expect(mockPrismaInstance.save.count).toHaveBeenCalledTimes(2)
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

  it('hides saved reviewers that became private or draft, unless the saver owns them', async () => {
    mockPrismaInstance.save.findMany.mockResolvedValue([])
    mockPrismaInstance.save.count.mockResolvedValue(0)

    await saveModel.findByUser('user-123')

    const visibleWhere = {
      userId: 'user-123',
      reviewer: {
        OR: [
          { visibility: { not: 'private' }, isDraft: false },
          { authorId: 'user-123' },
        ],
      },
    }
    expect(mockPrismaInstance.save.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: visibleWhere })
    )
    expect(mockPrismaInstance.save.count).toHaveBeenCalledWith({ where: visibleWhere })
  })

  it('pages saved reviewers in a stable order', async () => {
    mockPrismaInstance.save.findMany.mockResolvedValue([])
    mockPrismaInstance.save.count.mockResolvedValue(0)

    await saveModel.findByUser('user-123', { skip: 20, take: 20 })

    expect(mockPrismaInstance.save.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ reviewer: { createdAt: 'desc' } }, { reviewerId: 'asc' }],
      })
    )
  })
})
