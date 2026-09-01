import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import emailRoutes from '../../routes/emailRoutes.js'
import userModel from '../../models/userModel.js'
import sendgridService from '../../services/sendgridService.js'

vi.mock('../../models/userModel.js')
vi.mock('../../services/sendgridService.js')

const createApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/api/email', emailRoutes)
  return app
}

describe('Email Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('POST /api/email/verify/request', () => {
    it('should send verification email', async () => {
      userModel.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
      })
      sendgridService.sendVerificationEmail.mockResolvedValue({ statusCode: 202 })

      const response = await request(app)
        .post('/api/email/verify/request')
        .send({ email: 'test@example.com' })

      expect(response.status).toBe(200)
      expect(response.body.message).toContain('verification link has been sent')
    })

    it('should return success even if email not found', async () => {
      userModel.findByEmail.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/email/verify/request')
        .send({ email: 'nonexistent@example.com' })

      expect(response.status).toBe(200)
    })

    it('should return 400 if email not provided', async () => {
      const response = await request(app)
        .post('/api/email/verify/request')
        .send({})

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/email/verify/:token', () => {
    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .get('/api/email/verify/invalid-token')

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/email/unsubscribe/:email/:token', () => {
    it('should process unsubscribe request', async () => {
      const response = await request(app)
        .get('/api/email/unsubscribe/test@example.com/some-token')

      expect(response.status).toBe(200)
      expect(response.body.message).toContain('unsubscribed')
    })
  })
})
