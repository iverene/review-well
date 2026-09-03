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
vi.mock('../../../models/followModel.js', () => ({
  findByUsers: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countFollowers: vi.fn(),
  countFollowing: vi.fn(),
  isFollowing: vi.fn(),
}))
vi.mock('../../../models/likeModel.js', () => ({
  findByUserAndReviewer: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countByReviewer: vi.fn(),
  hasUserLiked: vi.fn(),
}))
vi.mock('../../../models/notificationModel.js', () => ({
  create: vi.fn(),
  findByRecipient: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  countUnread: vi.fn(),
  createLikeNotification: vi.fn(),
  createFollowNotification: vi.fn(),
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
vi.mock('../../../models/aiQuotaModel.js', () => ({
  getQuota: vi.fn(),
  checkQuota: vi.fn(),
  incrementUsage: vi.fn(),
  getRemainingQuota: vi.fn(),
}))
vi.mock('../../../services/openaiService.js', () => ({
  extractStudyBlocks: vi.fn(),
  getMockExtraction: vi.fn(),
  isConfigured: vi.fn().mockReturnValue(false),
}))

import { extractFromUpload, getQuotaStatus } from '../../../controllers/aiController.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'
import * as openaiService from '../../../services/openaiService.js'
import * as aiQuotaModel from '../../../models/aiQuotaModel.js'
import * as reviewerModel from '../../../models/reviewerModel.js'
import * as blockModel from '../../../models/blockModel.js'

describe('AI Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractFromUpload', () => {
    it('should return 400 when no file uploaded', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, file: null })
      const res = createMockResponse()

      await extractFromUpload(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' })
    })

    it('should return 429 when quota exceeded', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'text/plain', buffer: Buffer.from('test') },
        body: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'user-123' })
      aiQuotaModel.checkQuota.mockResolvedValue(false)

      await extractFromUpload(req, res)

      expect(res.status).toHaveBeenCalledWith(429)
    })

    it('should extract blocks successfully', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'text/plain', buffer: Buffer.from('test content'), originalname: 'test.txt' },
        body: {},
      })
      const res = createMockResponse()
      const mockBlocks = [
        { block_type: 'topic_banner', content_data: { heading: 'Test' } },
      ]

      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractStudyBlocks.mockResolvedValue(mockBlocks)
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(49)

      await extractFromUpload(req, res)

      expect(res.json).toHaveBeenCalledWith({
        blocks: mockBlocks,
        saved: false,
        remaining: 49,
        limit: 50,
      })
    })

    it('should save blocks when reviewerId provided', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'text/plain', buffer: Buffer.from('test'), originalname: 'test.txt' },
        body: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()
      const mockBlocks = [
        { block_type: 'topic_banner', content_data: { heading: 'Test' } },
      ]

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'user-123' })
      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractStudyBlocks.mockResolvedValue(mockBlocks)
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(49)
      blockModel.createMany.mockResolvedValue({ count: 1 })

      await extractFromUpload(req, res)

      expect(blockModel.createMany).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ saved: true })
      )
    })
  })

  describe('getQuotaStatus', () => {
    it('should return quota status', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()

      aiQuotaModel.getRemainingQuota.mockResolvedValue(45)

      await getQuotaStatus(req, res)

      expect(res.json).toHaveBeenCalledWith({
        remaining: 45,
        limit: 50,
        configured: false,
      })
    })
  })
})
