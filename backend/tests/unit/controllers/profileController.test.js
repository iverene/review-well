import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfile, updateProfile, getMyProfile } from '../../../controllers/profileController.js'
import userModel from '../../../models/userModel.js'
import reviewerModel from '../../../models/reviewerModel.js'
import followModel from '../../../models/followModel.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

vi.mock('../../../models/userModel.js')
vi.mock('../../../models/reviewerModel.js')
vi.mock('../../../models/followModel.js')

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
