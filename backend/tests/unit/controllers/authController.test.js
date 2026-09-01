import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMe, logout } from '../../../controllers/authController.js'
import userModel from '../../../models/userModel.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

vi.mock('../../../models/userModel.js')

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
      const req = createMockRequest({})
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
      req.session = null
      const res = createMockResponse()

      await logout(req, res)

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
