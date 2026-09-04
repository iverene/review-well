import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/userModel.js', () => ({
  getProfile: vi.fn(),
  findById: vi.fn(),
  findByGoogleId: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))
vi.mock('../../../models/reviewerModel.js', () => ({
  findPublic: vi.fn(),
  findByAuthor: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
}))
vi.mock('../../../models/blockModel.js', () => ({
  findByReviewer: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  removeAllByReviewer: vi.fn(),
  reorder: vi.fn(),
  getMaxSortOrder: vi.fn(),
}))
vi.mock('../../../models/followModel.js', () => ({
  findByUsers: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countFollowers: vi.fn(),
  countFollowing: vi.fn(),
  isFollowing: vi.fn(),
}))
vi.mock('../../../models/saveModel.js', () => ({
  findByUserAndReviewer: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countByReviewer: vi.fn(),
  findByUser: vi.fn(),
  hasUserSaved: vi.fn(),
}))
vi.mock('../../../models/notificationModel.js', () => ({
  create: vi.fn(),
  findByRecipient: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  countUnread: vi.fn(),
  createSaveNotification: vi.fn(),
  createFollowNotification: vi.fn(),
}))
vi.mock('../../../models/aiQuotaModel.js', () => ({
  getQuota: vi.fn(),
  checkQuota: vi.fn(),
  incrementUsage: vi.fn(),
  getRemainingQuota: vi.fn(),
}))

import {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
} from '../../../controllers/reviewerController.js'
import * as reviewerModel from '../../../models/reviewerModel.js'
import * as blockModel from '../../../models/blockModel.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

describe('Reviewer Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPublicReviewers', () => {
    it('should return paginated public reviewers', async () => {
      const req = createMockRequest({ query: { page: '1', limit: '20' } })
      const res = createMockResponse()
      const mockResult = {
        reviewers: [{ id: '1', title: 'Test' }],
        total: 1,
        hasMore: false,
      }

      reviewerModel.findPublic.mockResolvedValue(mockResult)

      await getPublicReviewers(req, res)

      expect(res.json).toHaveBeenCalledWith({
        reviewers: mockResult.reviewers,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          hasMore: false,
        },
      })
    })
  })

  describe('getMyReviewers', () => {
    it('should return current user reviewers', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, query: {} })
      const res = createMockResponse()
      const mockResult = {
        reviewers: [{ id: '1', title: 'My Reviewer' }],
        total: 1,
        hasMore: false,
      }

      reviewerModel.findByAuthor.mockResolvedValue(mockResult)

      await getMyReviewers(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        reviewers: mockResult.reviewers,
      }))
    })
  })

  describe('getReviewerById', () => {
    it('should return reviewer when found', async () => {
      const req = createMockRequest({ params: { id: '1' } })
      const res = createMockResponse()
      const mockReviewer = {
        id: '1',
        title: 'Test Reviewer',
        visibility: 'public',
        authorId: 'user-123',
      }

      reviewerModel.findById.mockResolvedValue(mockReviewer)

      await getReviewerById(req, res)

      expect(res.json).toHaveBeenCalledWith({ reviewer: mockReviewer })
    })

    it('should return 404 when not found', async () => {
      const req = createMockRequest({ params: { id: 'non-existent' } })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue(null)

      await getReviewerById(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ error: 'Reviewer not found' })
    })

    it('should return 403 for private reviewer when not owner', async () => {
      const req = createMockRequest({ params: { id: '1' }, user: { id: 'other-user' } })
      const res = createMockResponse()
      const mockReviewer = {
        id: '1',
        visibility: 'private',
        authorId: 'owner-user',
      }

      reviewerModel.findById.mockResolvedValue(mockReviewer)

      await getReviewerById(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('createReviewer', () => {
    it('should create reviewer with validated data', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        validatedBody: {
          title: 'New Reviewer',
          courseCode: 'MATH 101',
          courseDescription: 'Intro to Math',
          semester: 'Fall 2024',
          examType: 'midterm',
        },
      })
      const res = createMockResponse()
      const mockReviewer = { id: '1', title: 'New Reviewer', authorId: 'user-123' }

      reviewerModel.create.mockResolvedValue(mockReviewer)

      await createReviewer(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ reviewer: mockReviewer })
    })
  })

  describe('updateReviewer', () => {
    it('should update reviewer when owner', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user-123' },
        validatedBody: { title: 'Updated Title' },
      })
      const res = createMockResponse()
      const mockExisting = { id: '1', authorId: 'user-123' }
      const mockUpdated = { id: '1', title: 'Updated Title', authorId: 'user-123' }

      reviewerModel.findById.mockResolvedValue(mockExisting)
      reviewerModel.update.mockResolvedValue(mockUpdated)

      await updateReviewer(req, res)

      expect(res.json).toHaveBeenCalledWith({ reviewer: mockUpdated })
    })

    it('should return 403 when not owner', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        user: { id: 'other-user' },
        validatedBody: { title: 'Updated Title' },
      })
      const res = createMockResponse()
      const mockExisting = { id: '1', authorId: 'user-123' }

      reviewerModel.findById.mockResolvedValue(mockExisting)

      await updateReviewer(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should clear the draft flag when sharing as public', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user-123' },
        validatedBody: { visibility: 'public' },
      })
      const res = createMockResponse()
      const mockExisting = { id: '1', authorId: 'user-123', isDraft: true }

      reviewerModel.findById.mockResolvedValue(mockExisting)
      reviewerModel.update.mockResolvedValue({ ...mockExisting, visibility: 'public', isDraft: false })

      await updateReviewer(req, res)

      expect(reviewerModel.update).toHaveBeenCalledWith('1', { visibility: 'public', isDraft: false })
    })

    it('should clear the draft flag when sharing as unlisted', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user-123' },
        validatedBody: { visibility: 'unlisted' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: '1', authorId: 'user-123', isDraft: true })
      reviewerModel.update.mockResolvedValue({ id: '1', authorId: 'user-123', visibility: 'unlisted', isDraft: false })

      await updateReviewer(req, res)

      expect(reviewerModel.update).toHaveBeenCalledWith('1', { visibility: 'unlisted', isDraft: false })
    })

    it('should keep the draft flag when set back to private', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user-123' },
        validatedBody: { visibility: 'private' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: '1', authorId: 'user-123', isDraft: true })
      reviewerModel.update.mockResolvedValue({ id: '1', authorId: 'user-123', visibility: 'private', isDraft: true })

      await updateReviewer(req, res)

      expect(reviewerModel.update).toHaveBeenCalledWith('1', { visibility: 'private' })
    })
  })

  describe('deleteReviewer', () => {
    it('should delete reviewer when owner', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user-123' },
      })
      const res = createMockResponse()
      const mockExisting = { id: '1', authorId: 'user-123' }

      reviewerModel.findById.mockResolvedValue(mockExisting)
      reviewerModel.remove.mockResolvedValue({ id: '1' })

      await deleteReviewer(req, res)

      expect(res.json).toHaveBeenCalledWith({ message: 'Reviewer deleted successfully' })
    })

    it('should return 403 when not owner', async () => {
      const req = createMockRequest({
        params: { id: '1' },
        user: { id: 'other-user' },
      })
      const res = createMockResponse()
      const mockExisting = { id: '1', authorId: 'user-123' }

      reviewerModel.findById.mockResolvedValue(mockExisting)

      await deleteReviewer(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})
