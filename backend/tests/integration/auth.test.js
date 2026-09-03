import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'cookie-session'

vi.mock('../../models/userModel.js', () => ({
  getProfile: vi.fn(),
  findById: vi.fn(),
  findByGoogleId: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))
vi.mock('../../models/reviewerModel.js', () => ({
  findPublic: vi.fn(),
  findByAuthor: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
}))
vi.mock('../../models/followModel.js', () => ({
  findByUsers: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countFollowers: vi.fn(),
  countFollowing: vi.fn(),
  isFollowing: vi.fn(),
}))
vi.mock('../../models/blockModel.js', () => ({
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

import authRoutes from '../../routes/authRoutes.js'
import { requireAuth } from '../../middleware/auth.js'
import { getMe } from '../../controllers/authController.js'
import * as userModel from '../../models/userModel.js'

const createApp = () => {
  const app = express()
  app.use(express.json())
  app.use(
    session({
      name: 'session',
      keys: ['test-secret'],
      maxAge: 24 * 60 * 60 * 1000,
    })
  )
  app.use('/api/auth', authRoutes)
  return app
}

describe('Auth Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('GET /api/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Authentication required')
    })

    it('should return user profile when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      }

      userModel.getProfile.mockResolvedValue(mockUser)

      const testApp = express()
      testApp.use(express.json())
      testApp.get('/api/auth/me', (req, res, next) => {
        req.user = { id: 'user-123' }
        next()
      }, getMe)

      const response = await request(testApp).get('/api/auth/me')

      expect(response.status).toBe(200)
      expect(response.body.user).toEqual(mockUser)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).post('/api/auth/logout')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Authentication required')
    })
  })
})
