import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../models/reviewerFileModel.js', () => ({
  findByReviewerId: vi.fn(),
  create: vi.fn(),
  bumpVersion: vi.fn(),
  removeByReviewerId: vi.fn(),
}))

vi.mock('../../models/reviewerModel.js', () => ({
  findById: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../../services/adapters/storage.js', () => ({
  createStorageAdapter: vi.fn(),
}))

import reviewerFileRoutes from '../../routes/reviewerFileRoutes.js'
import * as reviewerFileModel from '../../models/reviewerFileModel.js'
import * as reviewerModel from '../../models/reviewerModel.js'
import { createStorageAdapter } from '../../services/adapters/storage.js'

// NOTE: adapted from the plan sketch — the repo has no `globalThis.__app` /
// `__signedIn` helpers, so each test builds a local app and injects req.user
// via a stub middleware (same approach as auth.test.js).
const createApp = (user) => {
  const app = express()
  app.use(express.json())
  if (user !== null) {
    app.use((req, res, next) => {
      req.user = user
      next()
    })
  }
  app.use('/api/reviewer-files', reviewerFileRoutes)
  return app
}

const OWNER = { id: 'user-123' }

const ownedReviewer = {
  id: 'reviewer-1',
  authorId: OWNER.id,
  title: 'Data Structures',
}

const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content')

describe('Reviewer File Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createStorageAdapter.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'user-123/reviewer-1/v1.pdf' }, error: null }),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/user-123/reviewer-1/v1.pdf' } })),
      delete: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  describe('POST /api/reviewer-files', () => {
    it('should return 400 for disallowed file types (.exe)', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)

      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/reviewer-files')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', Buffer.from('MZ fake exe'), 'malware.exe')

      expect(response.status).toBe(400)
    })

    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app)
        .post('/api/reviewer-files')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should return 401 (not 400) for guests even with a disallowed file type', async () => {
      const app = createApp(null)
      const response = await request(app)
        .post('/api/reviewer-files')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', Buffer.from('MZ fake exe'), 'malware.exe')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should return 403 when the reviewer belongs to someone else', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)

      const app = createApp({ id: 'user-other' })
      const response = await request(app)
        .post('/api/reviewer-files')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(403)
    })

    it('should upload a pdf for the owner with v1 storage path', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)
      reviewerFileModel.findByReviewerId.mockResolvedValue(null)
      reviewerFileModel.create.mockImplementation(async (data) => ({ id: 'file-1', ...data }))

      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/reviewer-files')
        .field('reviewerId', ownedReviewer.id)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(201)
      expect(response.body.file.version).toBe(1)
      expect(response.body.file.storagePath).toBe(`${OWNER.id}/${ownedReviewer.id}/v1.pdf`)
      expect(response.body.file.fileType).toBe('pdf')
    })
  })

  describe('PUT /api/reviewer-files/:reviewerId', () => {
    it('should bump version and set deckStale=true on replace', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)
      reviewerFileModel.findByReviewerId.mockResolvedValue({
        id: 'file-1',
        reviewerId: ownedReviewer.id,
        storagePath: `${OWNER.id}/${ownedReviewer.id}/v1.pdf`,
        fileType: 'pdf',
        byteSize: 24,
        version: 1,
      })
      reviewerFileModel.bumpVersion.mockImplementation(async (id, data) => ({ id, reviewerId: ownedReviewer.id, ...data }))
      reviewerModel.update.mockImplementation(async (id, data) => ({ ...ownedReviewer, ...data }))

      const app = createApp(OWNER)
      const response = await request(app)
        .put(`/api/reviewer-files/${ownedReviewer.id}`)
        .attach('file', pdfBuffer, 'notes-v2.pdf')

      expect(response.status).toBe(200)
      expect(response.body.file.version).toBe(2)
      expect(response.body.file.storagePath).toBe(`${OWNER.id}/${ownedReviewer.id}/v2.pdf`)
      expect(reviewerModel.update).toHaveBeenCalledWith(ownedReviewer.id, { deckStale: true })
    })

    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app)
        .put(`/api/reviewer-files/${ownedReviewer.id}`)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should return 403 when the reviewer belongs to someone else', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)

      const app = createApp({ id: 'user-other' })
      const response = await request(app)
        .put(`/api/reviewer-files/${ownedReviewer.id}`)
        .attach('file', pdfBuffer, 'notes.pdf')

      expect(response.status).toBe(403)
    })

    it('should return 400 for oversize (>25 MB) uploads', async () => {
      reviewerModel.findById.mockResolvedValue(ownedReviewer)

      const bigBuffer = Buffer.alloc(26 * 1024 * 1024, 0)
      const app = createApp(OWNER)
      const response = await request(app)
        .put(`/api/reviewer-files/${ownedReviewer.id}`)
        .attach('file', bigBuffer, 'huge.pdf')

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('File too large. Maximum size is 25MB')
    })
  })

  describe('GET /api/reviewer-files/:reviewerId/download', () => {
    const publicReviewer = { ...ownedReviewer, visibility: 'public', title: 'Data Structures!' }
    const storedFile = {
      id: 'file-1',
      reviewerId: ownedReviewer.id,
      storagePath: `${OWNER.id}/${ownedReviewer.id}/v1.pdf`,
      fileType: 'pdf',
      byteSize: 24,
      version: 1,
    }
    const pdfBytes = Buffer.from('%PDF-1.4 fake pdf content')
    const downloadMock = () => ({
      download: vi.fn().mockResolvedValue({
        data: new Blob([pdfBytes], { type: 'application/pdf' }),
        error: null,
      }),
    })

    it('should stream the exact bytes as an attachment for public reviewers (guest ok)', async () => {
      reviewerModel.findById.mockResolvedValue(publicReviewer)
      reviewerFileModel.findByReviewerId.mockResolvedValue(storedFile)
      createStorageAdapter.mockReturnValue(downloadMock())

      const app = createApp(null)
      const response = await request(app).get(`/api/reviewer-files/${ownedReviewer.id}/download`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('application/pdf')
      expect(response.headers['content-disposition']).toBe('attachment; filename="Data Structures.pdf"')
      expect(Number(response.headers['content-length'])).toBe(pdfBytes.length)
    })

    it('should return 403 for private reviewers to non-owners', async () => {
      reviewerModel.findById.mockResolvedValue({ ...ownedReviewer, visibility: 'private' })

      const app = createApp({ id: 'user-other' })
      const response = await request(app).get(`/api/reviewer-files/${ownedReviewer.id}/download`)

      expect(response.status).toBe(403)
    })

    it('should return 404 when no file is stored', async () => {
      reviewerModel.findById.mockResolvedValue(publicReviewer)
      reviewerFileModel.findByReviewerId.mockResolvedValue(null)

      const app = createApp(OWNER)
      const response = await request(app).get(`/api/reviewer-files/${ownedReviewer.id}/download`)

      expect(response.status).toBe(404)
    })

    it('should return 502 when storage fails', async () => {
      reviewerModel.findById.mockResolvedValue(publicReviewer)
      reviewerFileModel.findByReviewerId.mockResolvedValue(storedFile)
      createStorageAdapter.mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: null, error: 'boom' }),
      })

      const app = createApp(OWNER)
      const response = await request(app).get(`/api/reviewer-files/${ownedReviewer.id}/download`)

      expect(response.status).toBe(502)
    })
  })
})
