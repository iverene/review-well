import * as blurtingModel from '../models/blurtingModel.js'
import * as reviewerModel from '../models/reviewerModel.js'
import * as flashcardModel from '../models/flashcardModel.js'
import {
  checkGradeQuota,
  incrementGradeUsage,
  getRemainingGrades,
  GRADE_LIMIT,
} from '../models/aiQuotaModel.js'
import { gradeDump } from '../services/openaiService.js'

const SELF_RATINGS = ['missed', 'partial', 'nailed']

const SELF_FALLBACK_NOTICE = 'AI feedback limit reached — self-review mode'

const requireSignedIn = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'guest-write-blocked' })
    return false
  }
  return true
}

// Reads honor reviewer visibility (mirrors flashcardController.getCards):
// public and unlisted-via-link are readable by anyone; private requires
// owner; drafts are owner-only (they never appear in public listings).
const canRead = (reviewer, user) => {
  if (!reviewer) return false
  if (reviewer.visibility === 'private' && reviewer.authorId !== user?.id) return false
  if (reviewer.isDraft && reviewer.authorId !== user?.id) return false
  return true
}

// MVP displays the FIRST stored prompt as active (rotation deferred).
const getActivePrompt = (reviewer) => {
  if (!Array.isArray(reviewer.aiPrompts) || reviewer.aiPrompts.length === 0) {
    return null
  }
  return reviewer.aiPrompts[0]
}

// Self-compare reference is derived cheaply from the stored deck card fronts
// (no new file-parsing pipeline); falls back to the stored prompts when the
// reviewer has no cards yet.
const buildSelfReference = async (reviewerId, reviewer) => {
  const cards = await flashcardModel.findByReviewer(reviewerId)
  if (cards.length > 0) {
    const lines = cards.slice(0, 8).map((card) => `${card.front} — ${card.back}`)
    return {
      sourceExcerpt: lines.join('\n').slice(0, 600),
      keyPoints: cards.slice(0, 5).map((card) => card.front),
    }
  }
  const prompts = Array.isArray(reviewer.aiPrompts) ? reviewer.aiPrompts : []
  return {
    sourceExcerpt: prompts[0] || '',
    keyPoints: prompts.slice(1, 6),
  }
}

const submitDump = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { id } = req.params
    const { dumpText } = req.body || {}
    if (!dumpText?.trim()) {
      return res.status(400).json({ error: 'dumpText is required' })
    }

    const reviewer = await reviewerModel.findById(id)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (!canRead(reviewer, req.user)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const promptText = getActivePrompt(reviewer)
    if (!promptText) {
      return res.status(400).json({ error: 'No blurting prompt available for this reviewer' })
    }

    const hasQuota = await checkGradeQuota(req.user.id, GRADE_LIMIT)
    if (!hasQuota) {
      const { sourceExcerpt, keyPoints } = await buildSelfReference(id, reviewer)
      const attempt = await blurtingModel.create({
        reviewerId: id,
        userId: req.user.id,
        promptText,
        dumpText: dumpText.trim(),
        gradedVia: 'self',
      })
      return res.json({
        gradedVia: 'self',
        sourceExcerpt,
        keyPoints,
        attemptId: attempt.id,
        gradesLeft: 0,
        notice: SELF_FALLBACK_NOTICE,
      })
    }

    let grade
    try {
      grade = await gradeDump({ promptText, dumpText: dumpText.trim() })
    } catch (error) {
      // LLM timeout/failure consumes NO quota, retry allowed (mirrors aiController).
      return res.status(502).json({
        error: 'AI grading failed. No quota used — please retry.',
      })
    }

    // Quota consumed only on successful grading.
    await incrementGradeUsage(req.user.id)
    const attempt = await blurtingModel.create({
      reviewerId: id,
      userId: req.user.id,
      promptText,
      dumpText: dumpText.trim(),
      aiScore: grade.score,
      aiFeedback: grade.feedback,
      gradedVia: 'ai',
    })
    const gradesLeft = await getRemainingGrades(req.user.id, GRADE_LIMIT)

    res.json({
      gradedVia: 'ai',
      aiScore: grade.score,
      aiFeedback: grade.feedback,
      missedPoints: grade.missedPoints,
      gradesLeft,
      attemptId: attempt.id,
    })
  } catch (error) {
    console.error('Submit blurting dump error:', error)
    res.status(500).json({ error: 'Failed to grade blurting attempt' })
  }
}

const getHistory = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { id } = req.params
    const reviewer = await reviewerModel.findById(id)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (!canRead(reviewer, req.user)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const attempts = await blurtingModel.listByReviewerUser(id, req.user.id)
    res.json({ attempts })
  } catch (error) {
    console.error('Get blurting history error:', error)
    res.status(500).json({ error: 'Failed to fetch blurting attempts' })
  }
}

const setSelfRating = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { attemptId } = req.params
    const { selfRating } = req.body || {}
    if (!SELF_RATINGS.includes(selfRating)) {
      return res.status(400).json({ error: 'selfRating must be one of missed, partial, nailed' })
    }

    const attempt = await blurtingModel.findById(attemptId)
    if (!attempt) {
      return res.status(404).json({ error: 'Blurting attempt not found' })
    }
    if (attempt.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to rate this attempt' })
    }

    const updated = await blurtingModel.setSelfRating(attemptId, selfRating)
    res.json({ attempt: updated })
  } catch (error) {
    console.error('Set self-rating error:', error)
    res.status(500).json({ error: 'Failed to save self-rating' })
  }
}

export { submitDump, getHistory, setSelfRating, SELF_RATINGS }
