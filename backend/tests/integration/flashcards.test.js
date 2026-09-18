import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../models/flashcardModel.js', () => ({
  findByReviewer: vi.fn(),
  findCardById: vi.fn(),
  createCard: vi.fn(),
  setKnown: vi.fn(),
  updateCard: vi.fn(),
  removeCard: vi.fn(),
}))

vi.mock('../../models/reviewerModel.js', () => ({
  findById: vi.fn(),
}))

import flashcardRoutes from '../../routes/flashcardRoutes.js'
import * as flashcardModel from '../../models/flashcardModel.js'
import * as reviewerModel from '../../models/reviewerModel.js'

// NOTE: mirrors reviewerFiles.test.js — no global app helpers exist, so each
// test builds a local app and injects req.user via a stub middleware. The
// router defines full paths and mounts at /api (final URLs must be
// /api/reviewers/:id/cards and /api/cards/:cardId).
const createApp = (user) => {
  const app = express()
  app.use(express.json())
  if (user !== null) {
    app.use((req, res, next) => {
      req.user = user
      next()
    })
  }
  app.use('/api', flashcardRoutes)
  return app
}

const OWNER = { id: 'user-123' }

const publicReviewer = {
  id: 'reviewer-1',
  authorId: OWNER.id,
  title: 'Data Structures',
  visibility: 'public',
  isDraft: false,
}

const privateReviewer = {
  ...publicReviewer,
  id: 'reviewer-private',
  visibility: 'private',
}

const cards = [
  { id: 'card-1', reviewerId: publicReviewer.id, front: 'Front 1', back: 'Back 1', source: 'manual', sortOrder: 0, known: true },
  { id: 'card-2', reviewerId: publicReviewer.id, front: 'Front 2', back: 'Back 2', source: 'manual', sortOrder: 1, known: false },
]

describe('Flashcard Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/reviewers/:id/cards', () => {
    it('should return { cards, known, total } for a public reviewer (guest read OK)', async () => {
      reviewerModel.findById.mockResolvedValue(publicReviewer)
      flashcardModel.findByReviewer.mockResolvedValue(cards)

      const app = createApp(null)
      const response = await request(app).get(`/api/reviewers/${publicReviewer.id}/cards`)

      expect(response.status).toBe(200)
      expect(response.body.cards).toHaveLength(2)
      expect(response.body.known).toBe(1)
      expect(response.body.total).toBe(2)
    })

    it('should return 403 for a private reviewer when not the owner', async () => {
      reviewerModel.findById.mockResolvedValue(privateReviewer)

      const app = createApp(null)
      const response = await request(app).get(`/api/reviewers/${privateReviewer.id}/cards`)

      expect(response.status).toBe(403)
    })

    it('should return 404 for a missing reviewer', async () => {
      reviewerModel.findById.mockResolvedValue(null)

      const app = createApp(null)
      const response = await request(app).get('/api/reviewers/missing/cards')

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/reviewers/:id/cards', () => {
    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app)
        .post(`/api/reviewers/${publicReviewer.id}/cards`)
        .send({ front: 'Q', back: 'A' })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should return 403 when the reviewer belongs to someone else', async () => {
      reviewerModel.findById.mockResolvedValue(publicReviewer)

      const app = createApp({ id: 'user-other' })
      const response = await request(app)
        .post(`/api/reviewers/${publicReviewer.id}/cards`)
        .send({ front: 'Q', back: 'A' })

      expect(response.status).toBe(403)
    })

    it('should create a card for the owner', async () => {
      reviewerModel.findById.mockResolvedValue(publicReviewer)
      flashcardModel.findByReviewer.mockResolvedValue(cards)
      flashcardModel.createCard.mockImplementation(async (data) => ({ id: 'card-3', ...data }))

      const app = createApp(OWNER)
      const response = await request(app)
        .post(`/api/reviewers/${publicReviewer.id}/cards`)
        .send({ front: 'Q', back: 'A' })

      expect(response.status).toBe(201)
      expect(response.body.card.front).toBe('Q')
      expect(response.body.card.sortOrder).toBe(2)
    })
  })

  describe('PATCH /api/cards/:cardId', () => {
    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app).patch('/api/cards/card-1').send({ known: true })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should persist owner toggle of known', async () => {
      flashcardModel.findCardById.mockResolvedValue(cards[1])
      reviewerModel.findById.mockResolvedValue(publicReviewer)
      flashcardModel.setKnown.mockImplementation(async (id, known) => ({ ...cards[1], known }))

      const app = createApp(OWNER)
      const response = await request(app).patch('/api/cards/card-2').send({ known: true })

      expect(response.status).toBe(200)
      expect(response.body.card.known).toBe(true)
      expect(flashcardModel.setKnown).toHaveBeenCalledWith('card-2', true)
    })

    it('should return 403 when the card reviewer belongs to someone else', async () => {
      flashcardModel.findCardById.mockResolvedValue(cards[0])
      reviewerModel.findById.mockResolvedValue(publicReviewer)

      const app = createApp({ id: 'user-other' })
      const response = await request(app).patch('/api/cards/card-1').send({ known: true })

      expect(response.status).toBe(403)
    })

    it('should return 404 for a missing card', async () => {
      flashcardModel.findCardById.mockResolvedValue(null)

      const app = createApp(OWNER)
      const response = await request(app).patch('/api/cards/missing').send({ known: true })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/cards/:cardId', () => {
    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app).delete('/api/cards/card-1')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should delete for the owner', async () => {
      flashcardModel.findCardById.mockResolvedValue(cards[0])
      reviewerModel.findById.mockResolvedValue(publicReviewer)
      flashcardModel.removeCard.mockResolvedValue({ id: 'card-1' })

      const app = createApp(OWNER)
      const response = await request(app).delete('/api/cards/card-1')

      expect(response.status).toBe(200)
      expect(flashcardModel.removeCard).toHaveBeenCalledWith('card-1')
    })

    it('should return 403 when the card reviewer belongs to someone else', async () => {
      flashcardModel.findCardById.mockResolvedValue(cards[0])
      reviewerModel.findById.mockResolvedValue(publicReviewer)

      const app = createApp({ id: 'user-other' })
      const response = await request(app).delete('/api/cards/card-1')

      expect(response.status).toBe(403)
    })
  })
})
