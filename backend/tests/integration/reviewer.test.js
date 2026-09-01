import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'cookie-session'
import reviewerRoutes from '../../routes/reviewerRoutes.js'
import reviewerModel from '../../models/reviewerModel.js'
import { requireAuth } from '../../middleware/auth.js'

vi.mock('../../models/reviewerModel.js')

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
  app.use('/api/reviewers', reviewerRoutes)
  return app
}

describe('Reviewer Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    vi.clearAllMocks()
  })

  describe('GET /api/reviewers/public', () => {
    it('should return public reviewers', async () => {
      const mockResult = {
        reviewers: [{ id: '1', title: 'Public Reviewer' }],
        total: 1,
        hasMore: false,
      }

      reviewerModel.findPublic.mockResolvedValue(mockResult)

      const response = await request(app).get('/api/reviewers/public')

      expect(response.status).toBe(200)
      expect(response.body.reviewers).toEqual(mockResult.reviewers)
    })
  })

  describe('GET /api/reviewers/my', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/reviewers/my')

      expect(response.status).toBe(401)
    })

    it('should return user reviewers when authenticated', async () => {
      const mockResult = {
        reviewers: [{ id: '1', title: 'My Reviewer' }],
        total: 1,
        hasMore: false,
      }

      reviewerModel.findByAuthor.mockResolvedValue(mockResult)

      const app = createApp()
      app.get('/api/reviewers/my', (req, res, next) => {
        req.user = { id: 'user-123' }
        next()
      }, requireAuth, async (req, res) => {
        const result = await reviewerModel.findByAuthor(req.user.id)
        res.json(result)
      })

      const response = await request(app).get('/api/reviewers/my')

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/reviewers', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/reviewers')
        .send({ title: 'New Reviewer' })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/reviewers/:id', () => {
    it('should return reviewer when found', async () => {
      const mockReviewer = {
        id: '1',
        title: 'Test Reviewer',
        visibility: 'public',
        authorId: 'user-123',
      }

      reviewerModel.findById.mockResolvedValue(mockReviewer)

      const response = await request(app).get('/api/reviewers/1')

      expect(response.status).toBe(200)
      expect(response.body.reviewer).toEqual(mockReviewer)
    })

    it('should return 404 when not found', async () => {
      reviewerModel.findById.mockResolvedValue(null)

      const response = await request(app).get('/api/reviewers/non-existent')

      expect(response.status).toBe(404)
    })
  })
})
