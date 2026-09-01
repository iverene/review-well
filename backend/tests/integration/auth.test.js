import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'cookie-session'
import authRoutes from '../../routes/authRoutes.js'
import userModel from '../../models/userModel.js'

vi.mock('../../models/userModel.js')

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

      const app = createApp()
      app.get('/api/auth/me', (req, res, next) => {
        req.user = { id: 'user-123' }
        next()
      }, require('../../controllers/authController').getMe)

      const response = await request(app).get('/api/auth/me')

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
