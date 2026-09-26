import * as reviewerModel from '../models/reviewerModel.js'
import * as followModel from '../models/followModel.js'
import * as notificationModel from '../models/notificationModel.js'
import * as reviewerFileModel from '../models/reviewerFileModel.js'
import * as flashcardModel from '../models/flashcardModel.js'
import { getRemainingQuota, getRemainingGrades, GRADE_LIMIT } from '../models/aiQuotaModel.js'
import { DECK_QUOTA_LIMIT } from '../constants/quotas.js'
import { createStorageAdapter } from '../services/adapters/storage.js'
import { notifyEvent } from '../services/pushService.js'
import { parsePagination } from '../utils/pagination.js'
import { del, delPrefix } from '../utils/cache.js'

// Signed-URL lifetime for public reviewer files (private bucket, so even
// public files go through signed URLs). Unlisted/private use 60s inline.
const PUBLIC_FILE_URL_TTL_SECONDS = 7 * 24 * 60 * 60

const isVisibleToFollowers = (reviewer) => reviewer.visibility === 'public' && reviewer.isDraft === false

// Fan out a "friend published" notification to every follower.
// Fire-and-forget safe: notification failures never fail the request.
const notifyFollowersOfNewReviewer = async (authorId, reviewerId) => {
  try {
    const rows = await followModel.getFollowers(authorId)
    const recipients = rows
      .map((row) => row.follower?.id || row.followerId)
      .filter((id) => id && id !== authorId)
    if (recipients.length === 0) return
    await notificationModel.createMany(
      recipients.map((recipientId) => ({
        recipientId,
        actorId: authorId,
        actionType: 'new_reviewer',
        reviewerId,
      }))
    )
    notifyEvent({ actionType: 'new_reviewer', actorId: authorId, recipientIds: recipients, reviewerId })
  } catch (error) {
    console.error('New reviewer notification error:', error)
  }
}

const getPublicReviewers = async (req, res) => {
  try {
    const { page, limit, skip, take } = parsePagination(req.query)
    const { search = '', examType = '', semester = '' } = req.query

    const result = await reviewerModel.findPublic({ skip, take, search, examType, semester })

    res.json({
      reviewers: result.reviewers,
      pagination: {
        page,
        limit: take,
        total: result.total,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    console.error('Get public reviewers error:', error)
    res.status(500).json({ error: 'Failed to fetch reviewers' })
  }
}

const getAuthorReviewers = async (req, res) => {
  try {
    const { userId } = req.params
    const { page, limit, skip, take } = parsePagination(req.query, { defaultLimit: 50 })

    const result = await reviewerModel.findPublicByAuthor(userId, { skip, take })

    res.json({
      reviewers: result.reviewers,
      pagination: {
        page,
        limit: take,
        total: result.total,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    console.error('Get author reviewers error:', error)
    res.status(500).json({ error: 'Failed to fetch reviewers' })
  }
}

// Batch existence check for client-side caches (Recently Viewed rail).
// Returns only ids the requester may actually open: non-private,
// non-draft rows, plus own private/draft rows. Never leaks private rows
// of other users.
const getReadableIds = async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 20)
    if (ids.length === 0) {
      return res.json({ ids: [] })
    }

    const rows = await reviewerModel.findByIds(ids)
    const readable = rows
      .filter(
        (row) =>
          (row.visibility !== 'private' && !row.isDraft) || row.authorId === req.user?.id
      )
      .map((row) => row.id)

    res.json({ ids: readable })
  } catch (error) {
    console.error('Get readable ids error:', error)
    res.status(500).json({ error: 'Failed to validate reviewers' })
  }
}

const getMyReviewers = async (req, res) => {
  try {
    const { page, limit, skip, take } = parsePagination(req.query, { defaultLimit: 50 })

    const result = await reviewerModel.findByAuthor(req.user.id, { skip, take })

    res.json({
      reviewers: result.reviewers,
      pagination: {
        page,
        limit: take,
        total: result.total,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    console.error('Get my reviewers error:', error)
    res.status(500).json({ error: 'Failed to fetch your reviewers' })
  }
}

const getReviewerById = async (req, res) => {
  try {
    const { id } = req.params
    const reviewer = await reviewerModel.findById(id)

    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    // Check access permissions
    if (reviewer.visibility === 'private' && reviewer.authorId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Drafts never appear in public listings, so direct links stay
    // owner-only too (404, not 403, to avoid confirming existence).
    if (reviewer.isDraft && reviewer.authorId !== req.user?.id) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    if (reviewer.visibility === 'unlisted' && reviewer.authorId !== req.user?.id) {
      // Unlisted reviewers are accessible via direct link but not listed
    }

    // Study-hub enrichment (strictly additive — existing fields untouched):
    // fileUrl honors visibility. The bucket is private, so every visibility
    // level is served via signed URLs: public reviewers get a long-lived
    // (7-day) signed URL, unlisted/private get a 60s signed URL; private
    // non-owner already 403'd above, before any URL.
    // No public-URL fallback anywhere by design: a long-lived public URL
    // would leak unlisted/private files, so without signed-URL support the
    // file stays unserved (fileUrl: null, which the hub already handles).
    // Independent enrichment fetches run concurrently so detail loads in
    // a single round of parallel queries instead of a sequential chain.
    const [file, cards, quota] = await Promise.all([
      reviewerFileModel.findByReviewerId(id),
      flashcardModel.findByReviewer(id),
      req.user
        ? Promise.all([
            getRemainingQuota(req.user.id, DECK_QUOTA_LIMIT),
            getRemainingGrades(req.user.id, GRADE_LIMIT),
          ]).then(([decksLeft, gradesLeft]) => ({ decksLeft, gradesLeft }))
        : Promise.resolve({ decksLeft: 0, gradesLeft: 0 }),
    ])

    let fileUrl = null
    if (file) {
      const storage = createStorageAdapter()
      if (typeof storage.getSignedUrl === 'function') {
        const ttl = reviewer.visibility === 'public' ? PUBLIC_FILE_URL_TTL_SECONDS : 60
        const { data } = await storage.getSignedUrl(file.storagePath, ttl)
        fileUrl = data?.signedUrl || null
      }
    }

    const prompts = Array.isArray(reviewer.aiPrompts) ? reviewer.aiPrompts : []

    res.json({ reviewer: { ...reviewer, fileUrl, cards, prompts, quota } })
  } catch (error) {
    console.error('Get reviewer error:', error)
    res.status(500).json({ error: 'Failed to fetch reviewer' })
  }
}

const createReviewer = async (req, res) => {
  try {
    const data = { ...req.validatedBody }

    // Publishing at creation must behave like flipping to public/unlisted
    // later: public listings (and follower notifications) require a
    // non-draft, so non-private visibility clears the draft flag here too.
    if (data.visibility && data.visibility !== 'private') {
      data.isDraft = false
    }

    const reviewer = await reviewerModel.create({
      ...data,
      authorId: req.user.id,
    })

    delPrefix('reviewers:')
    del(`profile:${req.user.id}`)

    if (isVisibleToFollowers(reviewer)) {
      await notifyFollowersOfNewReviewer(req.user.id, reviewer.id)
    }

    res.status(201).json({ reviewer })
  } catch (error) {
    console.error('Create reviewer error:', error)
    res.status(500).json({ error: 'Failed to create reviewer' })
  }
}

const updateReviewer = async (req, res) => {
  try {
    const { id } = req.params
    const data = { ...req.validatedBody }

    // Sharing a reviewer publishes it: public listings and direct links
    // both require a non-draft, so flipping to public/unlisted clears the draft flag.
    if (data.visibility && data.visibility !== 'private') {
      data.isDraft = false
    }

    const existing = await reviewerModel.findById(id)
    if (!existing) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    if (existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this reviewer' })
    }

    const reviewer = await reviewerModel.update(id, data)
    delPrefix('reviewers:')
    del(`profile:${existing.authorId}`)
    // Notify on the transition to visible (e.g. draft -> published),
    // not on every edit of an already-visible reviewer.
    if (!isVisibleToFollowers(existing) && isVisibleToFollowers(reviewer)) {
      await notifyFollowersOfNewReviewer(existing.authorId, id)
    }
    res.json({ reviewer })
  } catch (error) {
    console.error('Update reviewer error:', error)
    res.status(500).json({ error: 'Failed to update reviewer' })
  }
}

const deleteReviewer = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await reviewerModel.findById(id)
    if (!existing) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    if (existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this reviewer' })
    }

    await reviewerModel.remove(id)
    // Best-effort: remove versioned source objects ({authorId}/{id}/v*).
    // File DB rows cascade via Prisma; storage cleanup must never fail the
    // request, so failures are logged and swallowed.
    try {
      const storage = createStorageAdapter()
      const { error: storageError } = await storage.removePrefix(`${existing.authorId}/${id}`)
      if (storageError) {
        console.error('Reviewer storage cleanup error:', storageError)
      }
    } catch (error) {
      console.error('Reviewer storage cleanup error:', error)
    }
    delPrefix('reviewers:')
    delPrefix('social:')
    del(`profile:${existing.authorId}`)
    res.json({ message: 'Reviewer deleted successfully' })
  } catch (error) {
    console.error('Delete reviewer error:', error)
    res.status(500).json({ error: 'Failed to delete reviewer' })
  }
}

export {
  getPublicReviewers,
  getAuthorReviewers,
  getMyReviewers,
  getReadableIds,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
}