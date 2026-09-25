import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/userModel.js', () => ({
  getProfile: vi.fn(),
  findById: vi.fn(),
  findByGoogleId: vi.fn(),
  findByEmail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))
vi.mock('../../../models/reviewerModel.js', () => ({
  findPublic: vi.fn(),
  findByAuthor: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
}))
vi.mock('../../../models/followModel.js', () => ({
  findByUsers: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countFollowers: vi.fn(),
  countFollowing: vi.fn(),
  isFollowing: vi.fn(),
}))
vi.mock('../../../models/saveModel.js', () => ({
  findByUserAndReviewer: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  countByReviewer: vi.fn(),
  findByUser: vi.fn(),
  hasUserSaved: vi.fn(),
}))
vi.mock('../../../models/notificationModel.js', () => ({
  create: vi.fn(),
  findByRecipient: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  countUnread: vi.fn(),
  createSaveNotification: vi.fn(),
  createFollowNotification: vi.fn(),
}))
vi.mock('../../../models/flashcardModel.js', () => ({
  findByReviewer: vi.fn(),
  createMany: vi.fn(),
  removeAllByReviewer: vi.fn(),
}))
vi.mock('../../../models/aiQuotaModel.js', () => ({
  getQuota: vi.fn(),
  checkQuota: vi.fn(),
  incrementUsage: vi.fn(),
  getRemainingQuota: vi.fn(),
}))
vi.mock('../../../services/openaiService.js', () => ({
  extractDeckAndPrompts: vi.fn(),
  capDeck: vi.fn(),
  isConfigured: vi.fn().mockReturnValue(false),
}))

import { extractFromUpload, getQuotaStatus } from '../../../controllers/aiController.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'
import * as openaiService from '../../../services/openaiService.js'
import * as aiQuotaModel from '../../../models/aiQuotaModel.js'
import * as reviewerModel from '../../../models/reviewerModel.js'
import * as flashcardModel from '../../../models/flashcardModel.js'

describe('AI Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractFromUpload', () => {
    it('should return 400 when no file uploaded', async () => {
      const req = createMockRequest({ user: { id: 'user-123' }, file: null })
      const res = createMockResponse()

      await extractFromUpload(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' })
    })

    it('should return 429 when deck quota exceeded', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'user-123' })
      flashcardModel.findByReviewer.mockResolvedValue([])
      aiQuotaModel.checkQuota.mockResolvedValue(false)

      await extractFromUpload(req, res)

      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ remaining: 0, limit: 3 })
      )
    })

    it('should generate deck without saving when no reviewerId', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: {},
      })
      const res = createMockResponse()
      const mockDeck = {
        cards: [{ front: 'Term', back: 'Definition' }],
        prompts: ['Explain the key ideas.'],
        trimmed: false,
        partial: false,
      }

      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockResolvedValue(mockDeck)
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(2)

      await extractFromUpload(req, res)

      expect(flashcardModel.createMany).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({
        cards: mockDeck.cards,
        prompts: mockDeck.prompts,
        saved: false,
        remaining: 2,
        limit: 3,
        trimmed: false,
        partial: false,
      })
    })

    it('should persist cards with source ai and reviewer deck fields when reviewerId provided', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()
      const mockDeck = {
        cards: [{ front: 'Term', back: 'Definition' }],
        prompts: ['Explain the key ideas.'],
        trimmed: false,
        partial: false,
      }

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'user-123' })
      flashcardModel.findByReviewer.mockResolvedValue([])
      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockResolvedValue(mockDeck)
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(2)
      flashcardModel.removeAllByReviewer.mockResolvedValue({ count: 0 })
      flashcardModel.createMany.mockResolvedValue({ count: 1 })

      await extractFromUpload(req, res)

      expect(flashcardModel.createMany).toHaveBeenCalledWith([
        { reviewerId: 'reviewer-1', front: 'Term', back: 'Definition', source: 'ai', sortOrder: 0 },
      ])
      expect(reviewerModel.update).toHaveBeenCalledWith(
        'reviewer-1',
        expect.objectContaining({ aiPrompts: mockDeck.prompts, deckStale: false })
      )
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ saved: true, limit: 3 })
      )
    })

    it('should return 409 when a deck exists and confirm is missing', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: { reviewerId: 'reviewer-1' },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'user-123' })
      flashcardModel.findByReviewer.mockResolvedValue([
        { id: 'card-1', front: 'Old', back: 'Old def' },
      ])

      await extractFromUpload(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ regenerateRequiresConfirm: true })
      )
      expect(openaiService.extractDeckAndPrompts).not.toHaveBeenCalled()
    })

    it('should regenerate with overwrite when confirm=true and quota remains', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: { reviewerId: 'reviewer-1', confirm: true },
      })
      const res = createMockResponse()
      const mockDeck = {
        cards: [{ front: 'New', back: 'New def' }],
        prompts: [],
        trimmed: false,
        partial: false,
      }

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'user-123' })
      flashcardModel.findByReviewer.mockResolvedValue([{ id: 'card-1' }])
      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockResolvedValue(mockDeck)
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(1)
      flashcardModel.removeAllByReviewer.mockResolvedValue({ count: 1 })
      flashcardModel.createMany.mockResolvedValue({ count: 1 })

      await extractFromUpload(req, res)

      expect(flashcardModel.removeAllByReviewer).toHaveBeenCalledWith('reviewer-1')
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ saved: true })
      )
    })

    it('should keep the existing deck and quota when confirmed regen returns no usable cards', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: { reviewerId: 'reviewer-1', confirm: true },
      })
      const res = createMockResponse()

      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: 'user-123' })
      flashcardModel.findByReviewer.mockResolvedValue([{ id: 'card-1', front: 'Old', back: 'Old def' }])
      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockResolvedValue({
        cards: [],
        prompts: [],
        trimmed: false,
        partial: false,
      })
      aiQuotaModel.getRemainingQuota.mockResolvedValue(3)

      await extractFromUpload(req, res)

      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          saved: false,
          notice: expect.stringContaining('existing deck was kept'),
        })
      )
      expect(flashcardModel.removeAllByReviewer).not.toHaveBeenCalled()
      expect(flashcardModel.createMany).not.toHaveBeenCalled()
      expect(reviewerModel.update).not.toHaveBeenCalled()
      expect(aiQuotaModel.incrementUsage).not.toHaveBeenCalled()
    })

    it('should return 502 without consuming quota on LLM timeout', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: {},
      })
      const res = createMockResponse()
      const timeoutError = new Error('AI deck generation failed')
      timeoutError.code = 'DECK_TIMEOUT'

      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockRejectedValue(timeoutError)

      await extractFromUpload(req, res)

      expect(res.status).toHaveBeenCalledWith(502)
      expect(aiQuotaModel.incrementUsage).not.toHaveBeenCalled()
    })

    it('should keep the file with a manual-add notice on parse failure', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: {},
      })
      const res = createMockResponse()
      const parseError = new Error('Failed to parse deck JSON')
      parseError.code = 'DECK_PARSE_FAILED'

      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockRejectedValue(parseError)
      aiQuotaModel.getRemainingQuota.mockResolvedValue(3)

      await extractFromUpload(req, res)

      expect(aiQuotaModel.incrementUsage).not.toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cards: [],
          prompts: [],
          saved: false,
          limit: 3,
          notice: expect.stringContaining('manually'),
        })
      )
    })

    it('should flag partial decks with a remainder notice', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: {},
      })
      const res = createMockResponse()

      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockResolvedValue({
        cards: [{ front: 'Term', back: 'Definition' }],
        prompts: [],
        trimmed: false,
        partial: true,
      })
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(2)

      await extractFromUpload(req, res)

      expect(aiQuotaModel.incrementUsage).toHaveBeenCalledWith('user-123')
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ partial: true, notice: expect.any(String) })
      )
    })

    it('should include a notice when the deck is trimmed', async () => {
      const req = createMockRequest({
        user: { id: 'user-123' },
        file: { mimetype: 'application/pdf', buffer: Buffer.from('test'), originalname: 'notes.pdf' },
        body: {},
      })
      const res = createMockResponse()

      aiQuotaModel.checkQuota.mockResolvedValue(true)
      openaiService.extractDeckAndPrompts.mockResolvedValue({
        cards: [{ front: 'Term', back: 'Definition' }],
        prompts: ['Prompt'],
        trimmed: true,
        partial: false,
      })
      aiQuotaModel.incrementUsage.mockResolvedValue({})
      aiQuotaModel.getRemainingQuota.mockResolvedValue(2)

      await extractFromUpload(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ trimmed: true, notice: 'Deck trimmed to 40 cards and 5 prompts.' })
      )
    })
  })

  describe('getQuotaStatus', () => {
    it('should return deck quota status', async () => {
      const req = createMockRequest({ user: { id: 'user-123' } })
      const res = createMockResponse()

      aiQuotaModel.getRemainingQuota.mockResolvedValue(2)

      await getQuotaStatus(req, res)

      expect(res.json).toHaveBeenCalledWith({
        remaining: 2,
        limit: 3,
        configured: false,
      })
    })
  })
})
