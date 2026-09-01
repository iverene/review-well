import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '../../../config/database.js'
import {
  findPublic,
  findByAuthor,
  findById,
  create,
  update,
  remove,
} from '../../../models/reviewerModel.js'

vi.mock('../../../config/database.js', () => ({
  prisma: {
    reviewer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Reviewer Model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findPublic', () => {
    it('should return public reviewers with pagination', async () => {
      const mockReviewers = [
        { id: '1', title: 'Test Reviewer', visibility: 'public', isDraft: false },
      ]
      prisma.reviewer.findMany.mockResolvedValue(mockReviewers)
      prisma.reviewer.count.mockResolvedValue(1)

      const result = await findPublic({ skip: 0, take: 20 })

      expect(result.reviewers).toEqual(mockReviewers)
      expect(result.total).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should filter by search term', async () => {
      prisma.reviewer.findMany.mockResolvedValue([])
      prisma.reviewer.count.mockResolvedValue(0)

      await findPublic({ skip: 0, take: 20, search: 'math' })

      expect(prisma.reviewer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.objectContaining({ contains: 'math' }) }),
            ]),
          }),
        })
      )
    })
  })

  describe('findByAuthor', () => {
    it('should return reviewers by author', async () => {
      const mockReviewers = [
        { id: '1', title: 'My Reviewer', authorId: 'user-123' },
      ]
      prisma.reviewer.findMany.mockResolvedValue(mockReviewers)
      prisma.reviewer.count.mockResolvedValue(1)

      const result = await findByAuthor('user-123')

      expect(result.reviewers).toEqual(mockReviewers)
    })
  })

  describe('findById', () => {
    it('should return reviewer with blocks', async () => {
      const mockReviewer = {
        id: '1',
        title: 'Test Reviewer',
        blocks: [{ id: 'block-1', sortOrder: 0 }],
      }
      prisma.reviewer.findUnique.mockResolvedValue(mockReviewer)

      const result = await findById('1')

      expect(result).toEqual(mockReviewer)
    })

    it('should return null for non-existent reviewer', async () => {
      prisma.reviewer.findUnique.mockResolvedValue(null)

      const result = await findById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new reviewer', async () => {
      const mockReviewer = {
        id: '1',
        title: 'New Reviewer',
        authorId: 'user-123',
      }
      prisma.reviewer.create.mockResolvedValue(mockReviewer)

      const result = await create({
        title: 'New Reviewer',
        authorId: 'user-123',
      })

      expect(result).toEqual(mockReviewer)
    })
  })

  describe('update', () => {
    it('should update reviewer', async () => {
      const mockReviewer = {
        id: '1',
        title: 'Updated Reviewer',
      }
      prisma.reviewer.update.mockResolvedValue(mockReviewer)

      const result = await update('1', { title: 'Updated Reviewer' })

      expect(result).toEqual(mockReviewer)
    })
  })

  describe('remove', () => {
    it('should delete reviewer', async () => {
      prisma.reviewer.delete.mockResolvedValue({ id: '1' })

      const result = await remove('1')

      expect(result).toEqual({ id: '1' })
    })
  })
})
