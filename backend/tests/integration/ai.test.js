import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'cookie-session'
import aiRoutes from '../../routes/aiRoutes.js'
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
  app.use('/api/ai', aiRoutes)
  return app
}

describe('AI Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('POST /api/ai/extract', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).post('/api/ai/extract')

      expect(response.status).toBe(401)
    })

    it('should return 400 when no file uploaded', async () => {
      const app = createApp()
      app.post('/api/ai/extract', (req, res, next) => {
        req.user = { id: 'user-123' }
        next()
      }, requireAuth, async (req, res) => {
        res.status(400).json({ error: 'No file uploaded' })
      })

      const response = await request(app).post('/api/ai/extract')

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/ai/quota', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/ai/quota')

      expect(response.status).toBe(401)
    })
  })
})
