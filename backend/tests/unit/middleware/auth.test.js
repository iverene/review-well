import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/userModel.js', () => ({
  getProfile: vi.fn(),
  findById: vi.fn(),
  findByGoogleId: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))

import { requireAuth, optionalAuth } from '../../../middleware/auth.js'
import * as userModel from '../../../models/userModel.js'
import { createMockRequest, createMockResponse, createMockNext } from '../../helpers/mocks.js'

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requireAuth', () => {
    it('should call next when user is authenticated', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()
      const next = createMockNext()

      await requireAuth(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', async () => {
      const req = createMockRequest({ user: undefined })
      const res = createMockResponse()
      const next = createMockNext()

      await requireAuth(req, res, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('optionalAuth', () => {
    it('should attach user profile when user exists', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()
      const next = createMockNext()
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      }

      userModel.getProfile.mockResolvedValue(mockProfile)

      await optionalAuth(req, res, next)

      expect(req.userProfile).toEqual(mockProfile)
      expect(next).toHaveBeenCalled()
    })

    it('should call next without profile when user does not exist', async () => {
      const req = createMockRequest({ user: undefined })
      const res = createMockResponse()
      const next = createMockNext()

      await optionalAuth(req, res, next)

      expect(req.userProfile).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('should call next even if profile fetch fails', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()
      const next = createMockNext()

      userModel.getProfile.mockRejectedValue(new Error('Database error'))

      await optionalAuth(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })
})
