import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'cookie-session'
import socialRoutes from '../../routes/socialRoutes.js'
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
  app.use('/api/social', socialRoutes)
  return app
}

describe('Social Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('POST /api/social/reviewers/:reviewerId/save', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).post('/api/social/reviewers/1/save')

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/social/reviewers/:reviewerId/save', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).delete('/api/social/reviewers/1/save')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/social/saved', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/social/saved')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/social/users/:userId/followers', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/social/users/1/followers')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/social/users/:userId/following', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/social/users/1/following')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/social/users/:userId/follow', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).post('/api/social/users/1/follow')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/social/notifications', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/social/notifications')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/social/notifications/unread-count', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/social/notifications/unread-count')

      expect(response.status).toBe(401)
    })
  })
})
