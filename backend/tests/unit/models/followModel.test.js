import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrismaInstance } = vi.hoisted(() => ({
  mockPrismaInstance: {
    follow: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('../../../config/database.js', () => ({ prisma: mockPrismaInstance }))

import * as followModel from '../../../models/followModel.js'

describe('Follow Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch followers without sorting by a missing timestamp', async () => {
    mockPrismaInstance.follow.findMany.mockResolvedValue([])

    await followModel.getFollowers('user-1')

    expect(mockPrismaInstance.follow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { followingId: 'user-1' } })
    )
    const query = mockPrismaInstance.follow.findMany.mock.calls[0][0]
    expect(query.orderBy).toBeUndefined()
  })

  it('should fetch following without sorting by a missing timestamp', async () => {
    mockPrismaInstance.follow.findMany.mockResolvedValue([])

    await followModel.getFollowing('user-1')

    expect(mockPrismaInstance.follow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { followerId: 'user-1' } })
    )
    const query = mockPrismaInstance.follow.findMany.mock.calls[0][0]
    expect(query.orderBy).toBeUndefined()
  })

  it('should batch-resolve which candidate users are followed', async () => {
    mockPrismaInstance.follow.findMany.mockResolvedValue([{ followingId: 'user-2' }])

    const followed = await followModel.followingIdsFor('user-1', ['user-2', 'user-3'])

    expect(followed).toEqual(new Set(['user-2']))
    expect(mockPrismaInstance.follow.findMany).toHaveBeenCalledWith({
      where: { followerId: 'user-1', followingId: { in: ['user-2', 'user-3'] } },
      select: { followingId: true },
    })
  })

  it('should skip the batch query when there are no candidates', async () => {
    const followed = await followModel.followingIdsFor('user-1', [])

    expect(followed).toEqual(new Set())
    expect(mockPrismaInstance.follow.findMany).not.toHaveBeenCalled()
  })
})
