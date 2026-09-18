import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../models/reviewerModel.js', () => ({
  findById: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../models/flashcardModel.js', () => ({
  findByReviewer: vi.fn(),
  createMany: vi.fn(),
  removeAllByReviewer: vi.fn(),
}))

vi.mock('../../models/aiQuotaModel.js', () => ({
  getQuota: vi.fn(),
  checkQuota: vi.fn(),
  incrementUsage: vi.fn(),
  getRemainingQuota: vi.fn(),
}))

vi.mock('../../services/openaiService.js', () => ({
  extractDeckAndPrompts: vi.fn(),
  capDeck: vi.fn(),
  isConfigured: vi.fn().mockReturnValue(false),
}))

import aiRoutes from '../../routes/aiRoutes.js'
import * as reviewerModel from '../../models/reviewerModel.js'
import * as flashcardModel from '../../models/flashcardModel.js'
import * as aiQuotaModel from '../../models/aiQuotaModel.js'
import * as openaiService from '../../services/openaiService.js'

// NOTE: mirrors tests/integration/reviewerFiles.test.js — a stub middleware
// injects req.user since the repo has no global signed-in test helper.
const createApp = (user) => {
  const app = express()
  app.use(express.json())
  if (user !== null) {
    app.use((req, res, next) => {
      req.user = user
      next()
    })
  }
  app.use('/api/ai', aiRoutes)
  return app
}

const OWNER = { id: 'user-123' }

const ownedReviewer = {
  id: 'reviewer-1',
  authorId: OWNER.id,
  title: 'Data Structures',
}

const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content')

const mockDeck = {
  cards: [{ front: 'Term', back: 'Definition' }],
  prompts: ['Explain the key ideas in your own words.'],
  trimmed: false,
  partial: false,
}

describe('AI Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/ai/extract', () => {
    it('should return 401 when not authenticated', async () => {
      const app = createApp(null)
      const response = await request(app)
        .post('/api/ai/extract')
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(401)
    })

    it('should return 400 when no file uploaded', async () => {
      const app = createApp(OWNER)
      const response = await request(app).post('/api/ai/extract')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('No file uploaded')
    })

    it('should reject TXT uploads (extract aligns to PDF/PPTX reviewer files)', async () => {
      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/ai/extract')
        .attach('file', Buffer.from('plain text notes'), 'notes.txt')

      expect(response.status).toBe(400)
    })

    it('should generate and persist a deck for a PDF upload', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)
      flashcardModel.findByReviewer.mockResolvedValue([])
      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockResolvedValue(mockDeck)
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(2)
      flashcardModel.removeAllByReviewer.mockResolvedValue({ count: 0 })
      flashcardModel.createMany.mockResolvedValue({ count: 1 })
      reviewerModel.update.mockImplementation(async (id, data) => ({ ...ownedReviewer, ...data }))

      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/ai/extract')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(200)
      expect(response.body.cards).toHaveLength(1)
      expect(response.body.prompts).toHaveLength(1)
      expect(response.body.limit).toBe(3)
      expect(response.body.remaining).toBe(2)
      expect(response.body.saved).toBe(true)
      expect(flashcardModel.createMany).toHaveBeenCalledWith([
        {
          reviewerId: ownedReviewer.id,
          front: 'Term',
          back: 'Definition',
          source: 'ai',
          sortOrder: 0,
        },
      ])
      expect(reviewerModel.update).toHaveBeenCalledWith(
        ownedReviewer.id,
        expect.objectContaining({ deckStale: false })
      )
    })

    it('should return 429 when deck quota is exhausted', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)
      flashcardModel.findByReviewer.mockResolvedValue([])
      aiQuotaModel.checkQuota.mockResolvedValue(false)

      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/ai/extract')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(429)
      expect(response.body.limit).toBe(3)
      expect(openaiService.extractDeckAndPrompts).not.toHaveBeenCalled()
    })

    it('should return 409 when regenerating without confirm', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)
      flashcardModel.findByReviewer.mockResolvedValue([{ id: 'card-1' }])

      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/ai/extract')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(409)
      expect(response.body.regenerateRequiresConfirm).toBe(true)
      expect(openaiService.extractDeckAndPrompts).not.toHaveBeenCalled()
    })

    it('should return 502 without consuming quota on LLM timeout', async () => {
      aiQuotaModel.checkQuota.mockResolvedValue(true)
      const timeoutError = new Error('AI deck generation failed')
      timeoutError.code = 'DECK_TIMEOUT'
      openaiService.extractDeckAndPrompts.mockRejectedValue(timeoutError)

      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/ai/extract')
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(502)
      expect(aiQuotaModel.incrementUsage).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/ai/quota', () => {
    it('should return 401 when not authenticated', async () => {
      const app = createApp(null)
      const response = await request(app).get('/api/ai/quota')

      expect(response.status).toBe(401)
    })

    it('should return the deck quota with limit 3', async () => {
      aiQuotaModel.getRemainingQuota.mockResolvedValue(2)

      const app = createApp(OWNER)
      const response = await request(app).get('/api/ai/quota')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ remaining: 2, limit: 3, configured: false })
    })
  })
})
