import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrismaInstance } = vi.hoisted(() => ({
  mockPrismaInstance: {
    reviewer: {
      findMany: vi.fn().mockResolvedValue([
        { id: '1', isDraft: false, title: 'Test Reviewer', visibility: 'public' },
        { id: '2', isDraft: false, title: 'Another Reviewer', visibility: 'public' },
      ]),
      findUnique: vi.fn().mockResolvedValue({ id: '1', isDraft: false, title: 'Test Reviewer', visibility: 'public' }),
      create: vi.fn().mockResolvedValue({ id: '1', isDraft: false, title: 'Test Reviewer', visibility: 'public' }),
      update: vi.fn().mockResolvedValue({ id: '1', isDraft: false, title: 'Test Reviewer', visibility: 'public' }),
      delete: vi.fn().mockResolvedValue({ id: '1' }),
      count: vi.fn().mockResolvedValue(2),
    },
  },
}))

vi.mock('../../../config/database.js', () => ({ prisma: mockPrismaInstance }))

import * as reviewerModel from '../../../models/reviewerModel.js'
import { clearAll } from '../../../utils/cache.js'

describe('Reviewer Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return public reviewers with pagination', async () => {
    const result = await reviewerModel.findPublic({ skip: 0, take: 20 })

    expect(result.reviewers).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.hasMore).toBe(false)
  })

  it('should filter by search term', async () => {
    await reviewerModel.findPublic({ skip: 0, take: 20, search: 'math' })

    expect(mockPrismaInstance.reviewer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { title: { contains: 'math', mode: 'insensitive' } },
          ]),
        }),
        orderBy: { updatedAt: 'desc' },
      })
    )
  })

  it('should return reviewers by author', async () => {
    const result = await reviewerModel.findByAuthor('user-123')
    expect(result.reviewers).toHaveLength(2)
  })

  it('should return a reviewer with blocks', async () => {
    const result = await reviewerModel.findById('1')
    expect(result).toEqual(expect.objectContaining({ id: '1' }))
  })

  it('should create a new reviewer', async () => {
    const result = await reviewerModel.create({ title: 'New Reviewer', authorId: 'user-123' })
    expect(result).toEqual(expect.objectContaining({ id: '1' }))
  })

  it('should update reviewer', async () => {
    const result = await reviewerModel.update('1', { title: 'Updated Reviewer' })
    expect(result).toEqual(expect.objectContaining({ id: '1' }))
  })

  it('should delete reviewer', async () => {
    const result = await reviewerModel.remove('1')
    expect(result).toEqual({ id: '1' })
  })

  it('should serve repeat list reads from cache', async () => {
    clearAll()
    mockPrismaInstance.reviewer.findMany.mockClear()
    mockPrismaInstance.reviewer.count.mockClear()

    await reviewerModel.findPublic({ skip: 0, take: 5 })
    await reviewerModel.findPublic({ skip: 0, take: 5 })

    expect(mockPrismaInstance.reviewer.findMany).toHaveBeenCalledTimes(1)
    expect(mockPrismaInstance.reviewer.count).toHaveBeenCalledTimes(1)
  })
})
