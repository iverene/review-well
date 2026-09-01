import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
} from '../../../controllers/reviewerController.js'
import reviewerModel from '../../../models/reviewerModel.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

vi.mock('../../../models/reviewerModel.js')

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
