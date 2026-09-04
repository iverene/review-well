import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'cookie-session'
import contactRoutes from '../../routes/contactRoutes.js'

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
  app.use('/api/contact', contactRoutes)
  return app
}

describe('Contact Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('POST /api/contact', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({ message: 'Hello developer' })

      expect(response.status).toBe(401)
    })
  })
})
