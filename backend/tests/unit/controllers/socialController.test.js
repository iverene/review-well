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

import {
  likeReviewer,
  unlikeReviewer,
  getLikeStatus,
  followUser,
  unfollowUser,
  getFollowStatus,
  getNotifications,
  markNotificationRead,
  getUnreadCount,
} from '../../../controllers/socialController.js'
import * as likeModel from '../../../models/likeModel.js'
import * as followModel from '../../../models/followModel.js'
import * as notificationModel from '../../../models/notificationModel.js'
import * as reviewerModel from '../../../models/reviewerModel.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

describe('Social Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('likeReviewer', () => {
    it('should like a reviewer', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'author-1' })
      likeModel.findByUserAndReviewer.mockResolvedValue(null)
      likeModel.create.mockResolvedValue({})
      notificationModel.createLikeNotification.mockResolvedValue({})
      likeModel.countByReviewer.mockResolvedValue(5)

      await likeReviewer(req, res)

      expect(res.json).toHaveBeenCalledWith({ liked: true, likeCount: 5 })
    })

    it('should return 404 if reviewer not found', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { reviewerId: 'non-existent' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue(null)

      await likeReviewer(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should return 400 if already liked', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1' })
      likeModel.findByUserAndReviewer.mockResolvedValue({ id: 'like-1' })

      await likeReviewer(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('unlikeReviewer', () => {
    it('should unlike a reviewer', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()

      likeModel.findByUserAndReviewer.mockResolvedValue({ id: 'like-1' })
      likeModel.remove.mockResolvedValue({})
      likeModel.countByReviewer.mockResolvedValue(4)

      await unlikeReviewer(req, res)

      expect(res.json).toHaveBeenCalledWith({ liked: false, likeCount: 4 })
    })

    it('should return 400 if not liked', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()

      likeModel.findByUserAndReviewer.mockResolvedValue(null)

      await unlikeReviewer(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('followUser', () => {
    it('should follow a user', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { userId: 'user-456' },
      })
      const res = createMockResponse()

      followModel.findByUsers.mockResolvedValue(null)
      followModel.create.mockResolvedValue({})
      notificationModel.createFollowNotification.mockResolvedValue({})
      followModel.countFollowers.mockResolvedValue(10)

      await followUser(req, res)

      expect(res.json).toHaveBeenCalledWith({ following: true, followerCount: 10 })
    })

    it('should return 400 if following self', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { userId: 'user-123' },
      })
      const res = createMockResponse()

      await followUser(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('unfollowUser', () => {
    it('should unfollow a user', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        params: { userId: 'user-456' },
      })
      const res = createMockResponse()

      followModel.findByUsers.mockResolvedValue({ id: 'follow-1' })
      followModel.remove.mockResolvedValue({})
      followModel.countFollowers.mockResolvedValue(9)

      await unfollowUser(req, res)

      expect(res.json).toHaveBeenCalledWith({ following: false, followerCount: 9 })
    })
  })

  describe('getNotifications', () => {
    it('should return notifications', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        query: { page: '1', limit: '20' },
      })
      const res = createMockResponse()

      notificationModel.findByRecipient.mockResolvedValue({
        notifications: [{ id: 'notif-1', actionType: 'like' }],
        total: 1,
      })

      await getNotifications(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.any(Array),
          total: 1,
        })
      )
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()

      notificationModel.countUnread.mockResolvedValue(5)

      await getUnreadCount(req, res)

      expect(res.json).toHaveBeenCalledWith({ count: 5 })
    })
  })
})
