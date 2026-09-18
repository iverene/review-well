import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../models/reviewerModel.js', () => ({
  findById: vi.fn(),
}))

vi.mock('../../models/reviewerFileModel.js', () => ({
  findByReviewerId: vi.fn(),
}))

vi.mock('../../models/flashcardModel.js', () => ({
  findByReviewer: vi.fn(),
  findCardById: vi.fn(),
  createCard: vi.fn(),
  setKnown: vi.fn(),
  updateCard: vi.fn(),
  removeCard: vi.fn(),
}))

vi.mock('../../models/aiQuotaModel.js', () => ({
  getRemainingQuota: vi.fn(),
  getRemainingGrades: vi.fn(),
  GRADE_LIMIT: 5,
}))

vi.mock('../../services/adapters/storage.js', () => ({
  createStorageAdapter: vi.fn(),
}))

vi.mock('../../models/userModel.js', () => ({
  getProfile: vi.fn(async (id) => ({ id })),
}))

import reviewerRoutes from '../../routes/reviewerRoutes.js'
import flashcardRoutes from '../../routes/flashcardRoutes.js'
import blurtingRoutes from '../../routes/blurtingRoutes.js'
import pomodoroRoutes from '../../routes/pomodoroRoutes.js'
import * as reviewerModel from '../../models/reviewerModel.js'
import * as reviewerFileModel from '../../models/reviewerFileModel.js'
import * as flashcardModel from '../../models/flashcardModel.js'
import * as aiQuotaModel from '../../models/aiQuotaModel.js'
import { createStorageAdapter } from '../../services/adapters/storage.js'

// Guest = no req.user injected anywhere. Route-level requireSignedIn must
// reject writes with 401 guest-write-blocked before any controller/model runs.
const createApp = (user = null) => {
  const app = express()
  app.use(express.json())
  if (user) {
    app.use((req, res, next) => {
      req.user = user
      next()
    })
  }
  app.use('/api/reviewers', reviewerRoutes)
  app.use('/api', flashcardRoutes)
  app.use('/api', blurtingRoutes)
  app.use('/api', pomodoroRoutes)
  return app
}

const createGuestApp = () => createApp(null)

const OWNER = { id: 'owner-1' }

const publicReviewer = {
  id: 'reviewer-public',
  authorId: OWNER.id,
  title: 'Photosynthesis',
  visibility: 'public',
  isDraft: false,
  aiPrompts: ['Explain the light reactions'],
}

const privateReviewer = {
  ...publicReviewer,
  id: 'reviewer-private',
  visibility: 'private',
}

const storedFile = {
  id: 'file-1',
  reviewerId: publicReviewer.id,
  storagePath: `${OWNER.id}/${publicReviewer.id}/v1.pdf`,
  fileType: 'pdf',
  byteSize: 1024,
  version: 1,
}

describe('Guest study-hub guards (Task 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    aiQuotaModel.getRemainingQuota.mockResolvedValue(3)
    aiQuotaModel.getRemainingGrades.mockResolvedValue(5)
    createStorageAdapter.mockReturnValue({
      upload: vi.fn(),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage.example.com/v1.pdf' } })),
      getSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'https://storage.example.com/signed/v1.pdf?token=abc' } })),
      delete: vi.fn(),
    })
  })

  it('blocks unauthenticated flashcard creation with 401 guest-write-blocked', async () => {
    const app = createGuestApp()
    const response = await request(app)
      .post(`/api/reviewers/${publicReviewer.id}/cards`)
      .send({ front: 'Q', back: 'A' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('guest-write-blocked')
  })

  it('blocks unauthenticated blurting submission with 401 guest-write-blocked', async () => {
    const app = createGuestApp()
    const response = await request(app)
      .post(`/api/reviewers/${publicReviewer.id}/blurting`)
      .send({ dumpText: 'everything I remember' })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('guest-write-blocked')
  })

  it('blocks unauthenticated pomodoro session writes with 401 guest-write-blocked', async () => {
    const app = createGuestApp()
    const now = new Date()
    const response = await request(app).post('/api/pomodoro/sessions').send({
      reviewerId: publicReviewer.id,
      breakSeconds: 300,
      startedAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      endedAt: now.toISOString(),
    })

    expect(response.status).toBe(401)
    expect(response.body.error).toBe('guest-write-blocked')
  })

  it('never leaks a private reviewer file URL to a non-owner (403, no URL anywhere)', async () => {
    reviewerModel.findById.mockResolvedValue(privateReviewer)

    const app = createGuestApp()
    const response = await request(app).get(`/api/reviewers/${privateReviewer.id}`)

    expect(response.status).toBe(403)
    expect(JSON.stringify(response.body)).not.toContain('storage')
    expect(JSON.stringify(response.body)).not.toContain('signedUrl')
    expect(response.body.reviewer?.fileUrl).toBeUndefined()
  })

  it('serves a public reviewer file URL on the additive fileUrl field', async () => {
    reviewerModel.findById.mockResolvedValue(publicReviewer)
    reviewerFileModel.findByReviewerId.mockResolvedValue(storedFile)
    flashcardModel.findByReviewer.mockResolvedValue([])

    const app = createGuestApp()
    const response = await request(app).get(`/api/reviewers/${publicReviewer.id}`)

    expect(response.status).toBe(200)
    expect(response.body.reviewer.title).toBe('Photosynthesis')
    expect(response.body.reviewer.fileUrl).toBe('https://storage.example.com/v1.pdf')
    expect(response.body.reviewer.cards).toEqual([])
    expect(response.body.reviewer.prompts).toEqual(['Explain the light reactions'])
    // Guests hold no quota — taste-only, zero writes.
    expect(response.body.reviewer.quota).toEqual({ decksLeft: 0, gradesLeft: 0 })
  })

  it('serves a short-lived signed URL (not the public URL) for unlisted reviewers', async () => {
    const unlisted = { ...publicReviewer, id: 'reviewer-unlisted', visibility: 'unlisted' }
    const unlistedFile = { ...storedFile, reviewerId: unlisted.id }
    reviewerModel.findById.mockResolvedValue(unlisted)
    reviewerFileModel.findByReviewerId.mockResolvedValue(unlistedFile)
    flashcardModel.findByReviewer.mockResolvedValue([])

    const app = createGuestApp()
    const response = await request(app).get(`/api/reviewers/${unlisted.id}`)

    expect(response.status).toBe(200)
    expect(response.body.reviewer.fileUrl).toBe('https://storage.example.com/signed/v1.pdf?token=abc')
    const storage = createStorageAdapter()
    expect(storage.getSignedUrl).toHaveBeenCalledWith(unlistedFile.storagePath, 60)
    expect(storage.getPublicUrl).not.toHaveBeenCalled()
  })

  it('resolves real quota for the signed-in owner', async () => {
    reviewerModel.findById.mockResolvedValue(publicReviewer)
    reviewerFileModel.findByReviewerId.mockResolvedValue(storedFile)
    flashcardModel.findByReviewer.mockResolvedValue([])

    const app = createApp(OWNER)
    const response = await request(app).get(`/api/reviewers/${publicReviewer.id}`)

    expect(response.status).toBe(200)
    expect(response.body.reviewer.quota).toEqual({ decksLeft: 3, gradesLeft: 5 })
  })

  it('serves fileUrl null (never a public URL) when the adapter lacks getSignedUrl', async () => {
    const unlisted = { ...publicReviewer, id: 'reviewer-unlisted', visibility: 'unlisted' }
    const unlistedFile = { ...storedFile, reviewerId: unlisted.id }
    reviewerModel.findById.mockResolvedValue(unlisted)
    reviewerFileModel.findByReviewerId.mockResolvedValue(unlistedFile)
    flashcardModel.findByReviewer.mockResolvedValue([])
    createStorageAdapter.mockReturnValue({
      upload: vi.fn(),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage.example.com/v1.pdf' } })),
      delete: vi.fn(),
    })

    const app = createGuestApp()
    const response = await request(app).get(`/api/reviewers/${unlisted.id}`)

    expect(response.status).toBe(200)
    expect(response.body.reviewer.fileUrl).toBeNull()
    expect(JSON.stringify(response.body)).not.toContain('storage.example.com')
  })
})
