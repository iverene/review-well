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

vi.mock('../../../services/adapters/storage.js', () => ({
  createStorageAdapter: vi.fn(),
}))

import { getProfile, updateProfile, getMyProfile, searchUsers, updateAvatar } from '../../../controllers/profileController.js'
import { createStorageAdapter } from '../../../services/adapters/storage.js'
import * as userModel from '../../../models/userModel.js'
import * as reviewerModel from '../../../models/reviewerModel.js'
import * as followModel from '../../../models/followModel.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

describe('Profile Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = createMockRequest({ params: { userId: 'user-123' } })
      const res = createMockResponse()

      userModel.getProfile.mockResolvedValue({
        id: 'user-123',
        displayName: 'Test User',
        email: 'test@example.com',
      })
      reviewerModel.count.mockResolvedValue(5)
      followModel.countFollowers.mockResolvedValue(10)
      followModel.countFollowing.mockResolvedValue(3)
      followModel.isFollowing.mockResolvedValue(false)

      await getProfile(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            reviewerCount: 5,
            followerCount: 10,
            followingCount: 3,
          }),
        })
      )
    })

    it('should return 404 if user not found', async () => {
      const req = createMockRequest({ params: { userId: 'non-existent' } })
      const res = createMockResponse()

      userModel.getProfile.mockResolvedValue(null)

      await getProfile(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        body: { displayName: 'New Name', school: 'MIT' },
      })
      const res = createMockResponse()

      userModel.update.mockResolvedValue({ id: 'user-123' })
      userModel.getProfile.mockResolvedValue({
        id: 'user-123',
        displayName: 'New Name',
        school: 'MIT',
      })

      await updateProfile(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            displayName: 'New Name',
            school: 'MIT',
          }),
        })
      )
    })
  })

  describe('searchUsers', () => {
    it('should return matching users with follow state', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, query: { q: 'ann' } })
      const res = createMockResponse()

      userModel.searchUsers = vi.fn().mockResolvedValue([
        { id: 'user-456', displayName: 'Ann Lee' },
      ])
      followModel.isFollowing.mockResolvedValue(true)

      await searchUsers(req, res)

      expect(userModel.searchUsers).toHaveBeenCalledWith('ann', { take: 20, excludeId: 'user-123' })
      expect(res.json).toHaveBeenCalledWith({
        users: [{ id: 'user-456', displayName: 'Ann Lee', isFollowing: true }],
      })
    })

    it('should exclude the current user from results', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, query: {} })
      const res = createMockResponse()

      userModel.searchUsers = vi.fn().mockResolvedValue([])

      await searchUsers(req, res)

      expect(userModel.searchUsers).toHaveBeenCalledWith('', expect.objectContaining({ excludeId: 'user-123' }))
      expect(res.json).toHaveBeenCalledWith({ users: [] })
    })
  })

  describe('updateAvatar', () => {
    const avatarFile = () => ({
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/png',
      size: 1024,
    })

    it('should upload an avatar and store its public URL', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, file: avatarFile() })
      const res = createMockResponse()
      const storage = {
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/avatars/user-123/1.png' } }),
      }
      createStorageAdapter.mockReturnValue(storage)
      userModel.update.mockResolvedValue({})
      userModel.getProfile.mockResolvedValue({ id: 'user-123', avatarUrl: 'https://cdn.example.com/avatars/user-123/1.png' })

      await updateAvatar(req, res)

      expect(storage.upload).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringMatching(/^avatars\/user-123\/\d+\.png$/),
        'image/png'
      )
      expect(userModel.update).toHaveBeenCalledWith('user-123', {
        avatarUrl: 'https://cdn.example.com/avatars/user-123/1.png',
      })
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ user: expect.objectContaining({ id: 'user-123' }) })
      )
    })

    it('should accept an avatar URL without a file', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        body: { avatarUrl: 'https://example.com/me.png' },
      })
      const res = createMockResponse()
      userModel.getProfile.mockResolvedValue({ id: 'user-123' })

      await updateAvatar(req, res)

      expect(userModel.update).toHaveBeenCalledWith('user-123', { avatarUrl: 'https://example.com/me.png' })
    })

    it('should return 400 when nothing is provided', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, body: {} })
      const res = createMockResponse()

      await updateAvatar(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 503 when storage is not configured', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, file: avatarFile() })
      const res = createMockResponse()
      createStorageAdapter.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: 'Storage not configured' }),
        getPublicUrl: vi.fn(),
      })

      await updateAvatar(req, res)

      expect(res.status).toHaveBeenCalledWith(503)
    })
  })

  describe('getMyProfile', () => {
    it('should return current user profile', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()

      userModel.getProfile.mockResolvedValue({
        id: 'user-123',
        displayName: 'Test User',
      })
      reviewerModel.count.mockResolvedValue(5)
      followModel.countFollowers.mockResolvedValue(10)
      followModel.countFollowing.mockResolvedValue(3)

      await getMyProfile(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            reviewerCount: 5,
            followerCount: 10,
            followingCount: 3,
          }),
        })
      )
    })
  })
})
