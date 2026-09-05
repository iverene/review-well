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
  isConfigured: vi.fn(),
}))

import { getMe, logout } from '../../../controllers/authController.js'
import * as userModel from '../../../models/userModel.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMe', () => {
    it('should return user profile when authenticated', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      }

      userModel.getProfile.mockResolvedValue(mockUser)

      await getMe(req, res, vi.fn())

      expect(res.json).toHaveBeenCalledWith({ user: mockUser })
    })

    it('should return 401 when not authenticated', async () => {
      const req = createMockRequest({ user: undefined })
      const res = createMockResponse()

      await getMe(req, res, vi.fn())

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' })
    })

    it('should return 500 on database error', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()

      userModel.getProfile.mockRejectedValue(new Error('Database error'))

      await getMe(req, res, vi.fn())

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get user' })
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const req = createMockRequest({})
      req.logout = vi.fn((callback) => callback(null))
      req.session = { passport: { user: 'user-123' } }
      const res = createMockResponse()

      await logout(req, res)

      expect(req.session).toBeNull()
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' })
    })

    it('should return 500 on logout error', async () => {
      const req = createMockRequest({})
      req.logout = vi.fn((callback) => callback(new Error('Logout failed')))
      const res = createMockResponse()

      await logout(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to logout' })
    })
  })
})
