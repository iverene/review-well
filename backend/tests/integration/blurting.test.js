import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../models/blurtingModel.js', () => ({
  create: vi.fn(),
  listByReviewerUser: vi.fn(),
  findById: vi.fn(),
  setSelfRating: vi.fn(),
}))

vi.mock('../../models/reviewerModel.js', () => ({
  findById: vi.fn(),
}))

vi.mock('../../models/flashcardModel.js', () => ({
  findByReviewer: vi.fn(),
}))

vi.mock('../../models/aiQuotaModel.js', () => ({
  GRADE_LIMIT: 5,
  checkGradeQuota: vi.fn(),
  incrementGradeUsage: vi.fn(),
  getRemainingGrades: vi.fn(),
}))

vi.mock('../../services/openaiService.js', () => ({
  gradeDump: vi.fn(),
}))

import blurtingRoutes from '../../routes/blurtingRoutes.js'
import * as blurtingModel from '../../models/blurtingModel.js'
import * as reviewerModel from '../../models/reviewerModel.js'
import * as flashcardModel from '../../models/flashcardModel.js'
import * as aiQuotaModel from '../../models/aiQuotaModel.js'
import * as openaiService from '../../services/openaiService.js'

// NOTE: mirrors flashcards.test.js — no global app helpers exist, so each
// test builds a local app and injects req.user via a stub middleware. The
// router defines full paths and mounts at /api (final URLs must be
// POST|GET /api/reviewers/:id/blurting and PATCH /api/blurting/:attemptId).
const createApp = (user) => {
  const app = express()
  app.use(express.json())
  if (user !== null) {
    app.use((req, res, next) => {
      req.user = user
      next()
    })
  }
  app.use('/api', blurtingRoutes)
  return app
}

const OWNER = { id: 'user-123' }

const reviewerWithPrompt = {
  id: 'reviewer-1',
  authorId: OWNER.id,
  title: 'Data Structures',
  visibility: 'public',
  aiPrompts: ['Explain the key ideas from this material in your own words.'],
}

describe('Blurting Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/reviewers/:id/blurting', () => {
    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app)
        .post(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)
        .send({ dumpText: 'Everything I remember...' })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should return 400 for non-string or oversized dumpText', async () => {
      const app = createApp(OWNER)

      const nonString = await request(app)
        .post(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)
        .send({ dumpText: 12345 })

      expect(nonString.status).toBe(400)

      const oversized = await request(app)
        .post(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)
        .send({ dumpText: 'x'.repeat(5001) })

      expect(oversized.status).toBe(400)
    })

    it('should grade via AI with score + feedback + gradesLeft and consume 1 grade', async () => {
      reviewerModel.findById.mockResolvedValue(reviewerWithPrompt)
      aiQuotaModel.checkGradeQuota.mockResolvedValue(true)
      openaiService.gradeDump.mockResolvedValue({
        score: 8,
        feedback: 'Strong recall, missed the base cases.',
        missedPoints: ['Base cases'],
      })
      aiQuotaModel.incrementGradeUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingGrades.mockResolvedValue(4)
      blurtingModel.create.mockImplementation(async (data) => ({ id: 'attempt-1', ...data }))

      const app = createApp(OWNER)
      const response = await request(app)
        .post(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)
        .send({ dumpText: 'Everything I remember...' })

      expect(response.status).toBe(200)
      expect(response.body.gradedVia).toBe('ai')
      expect(response.body.aiScore).toBe(8)
      expect(response.body.aiFeedback).toBe('Strong recall, missed the base cases.')
      expect(response.body.gradesLeft).toBe(4)
      expect(aiQuotaModel.incrementGradeUsage).toHaveBeenCalledWith(OWNER.id)
      expect(blurtingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ gradedVia: 'ai', aiScore: 8 })
      )
    })

    it('should fall back to self-compare without consuming quota when the grade bucket is empty', async () => {
      reviewerModel.findById.mockResolvedValue(reviewerWithPrompt)
      aiQuotaModel.checkGradeQuota.mockResolvedValue(false)
      flashcardModel.findByReviewer.mockResolvedValue([
        { id: 'card-1', front: 'Big-O', back: 'Growth rate' },
      ])
      blurtingModel.create.mockImplementation(async (data) => ({ id: 'attempt-2', ...data }))

      const app = createApp(OWNER)
      const response = await request(app)
        .post(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)
        .send({ dumpText: 'Everything I remember...' })

      expect(response.status).toBe(200)
      expect(response.body.gradedVia).toBe('self')
      expect(response.body.sourceExcerpt).toBeTruthy()
      expect(response.body.keyPoints).toBeTruthy()
      expect(response.body.attemptId).toBe('attempt-2')
      expect(openaiService.gradeDump).not.toHaveBeenCalled()
      expect(aiQuotaModel.incrementGradeUsage).not.toHaveBeenCalled()
      expect(blurtingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ gradedVia: 'self' })
      )
    })

    it('should return 400 when dumpText is missing', async () => {
      const app = createApp(OWNER)
      const response = await request(app)
        .post(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)
        .send({ dumpText: '   ' })

      expect(response.status).toBe(400)
    })

    it('should return 502 without consuming quota on LLM failure', async () => {
      reviewerModel.findById.mockResolvedValue(reviewerWithPrompt)
      aiQuotaModel.checkGradeQuota.mockResolvedValue(true)
      const llmError = new Error('AI grading failed')
      llmError.code = 'GRADE_LLM_FAILED'
      openaiService.gradeDump.mockRejectedValue(llmError)

      const app = createApp(OWNER)
      const response = await request(app)
        .post(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)
        .send({ dumpText: 'Everything I remember...' })

      expect(response.status).toBe(502)
      expect(aiQuotaModel.incrementGradeUsage).not.toHaveBeenCalled()
      expect(blurtingModel.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/reviewers/:id/blurting', () => {
    it('should return 401 when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app).get(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)

      expect(response.status).toBe(401)
    })

    it('should return the attempt history for a signed-in user', async () => {
      reviewerModel.findById.mockResolvedValue(reviewerWithPrompt)
      blurtingModel.listByReviewerUser.mockResolvedValue([
        { id: 'attempt-1', gradedVia: 'ai', aiScore: 8 },
      ])

      const app = createApp(OWNER)
      const response = await request(app).get(`/api/reviewers/${reviewerWithPrompt.id}/blurting`)

      expect(response.status).toBe(200)
      expect(response.body.attempts).toHaveLength(1)
      expect(blurtingModel.listByReviewerUser).toHaveBeenCalledWith(reviewerWithPrompt.id, OWNER.id)
    })
  })

  describe('PATCH /api/blurting/:attemptId', () => {
    it('should return 401 when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app)
        .patch('/api/blurting/attempt-1')
        .send({ selfRating: 'nailed' })

      expect(response.status).toBe(401)
    })

    it('should persist a valid self-rating', async () => {
      blurtingModel.findById.mockResolvedValue({
        id: 'attempt-1',
        userId: OWNER.id,
        gradedVia: 'self',
      })
      blurtingModel.setSelfRating.mockImplementation(async (id, selfRating) => ({
        id,
        userId: OWNER.id,
        selfRating,
      }))

      const app = createApp(OWNER)
      const response = await request(app)
        .patch('/api/blurting/attempt-1')
        .send({ selfRating: 'nailed' })

      expect(response.status).toBe(200)
      expect(response.body.attempt.selfRating).toBe('nailed')
      expect(blurtingModel.setSelfRating).toHaveBeenCalledWith('attempt-1', 'nailed')
    })

    it('should reject an invalid self-rating enum value', async () => {
      const app = createApp(OWNER)
      const response = await request(app)
        .patch('/api/blurting/attempt-1')
        .send({ selfRating: 'crushed-it' })

      expect(response.status).toBe(400)
      expect(blurtingModel.setSelfRating).not.toHaveBeenCalled()
    })

    it('should return 403 when the attempt belongs to someone else', async () => {
      blurtingModel.findById.mockResolvedValue({
        id: 'attempt-1',
        userId: 'user-other',
        gradedVia: 'self',
      })

      const app = createApp(OWNER)
      const response = await request(app)
        .patch('/api/blurting/attempt-1')
        .send({ selfRating: 'partial' })

      expect(response.status).toBe(403)
    })

    it('should return 404 for a missing attempt', async () => {
      blurtingModel.findById.mockResolvedValue(null)

      const app = createApp(OWNER)
      const response = await request(app)
        .patch('/api/blurting/missing')
        .send({ selfRating: 'missed' })

      expect(response.status).toBe(404)
    })
  })
})
