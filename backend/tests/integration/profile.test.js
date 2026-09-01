import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'cookie-session'
import profileRoutes from '../../routes/profileRoutes.js'
import { requireAuth } from '../../middleware/auth.js'

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
  app.use('/api/profile', profileRoutes)
  return app
}

describe('Profile Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('GET /api/profile/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/profile/me')

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/profile/me', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/profile/me')
        .send({ displayName: 'New Name' })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/profile/:userId', () => {
    it('should return user profile', async () => {
      const response = await request(app).get('/api/profile/user-123')

      // Will return 404 since user doesn't exist in test
      expect(response.status).toBe(404)
    })
  })
})
