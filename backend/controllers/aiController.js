import { extractDeckAndPrompts, isConfigured } from '../services/openaiService.js'
import { checkQuota, incrementUsage, getRemainingQuota } from '../models/aiQuotaModel.js'
import * as flashcardModel from '../models/flashcardModel.js'
import * as reviewerModel from '../models/reviewerModel.js'
import { delPrefix } from '../utils/cache.js'

// Deck quota: 3 AI generations per rolling 7-day window per user.
const DECK_QUOTA_LIMIT = 3

const wantsOverwrite = (value) => value === true || value === 'true'

const extractFromUpload = async (req, res) => {
  try {
    const { reviewerId, confirm } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Check if reviewer exists and user owns it
    let reviewer = null
    if (reviewerId) {
      reviewer = await reviewerModel.findById(reviewerId)
      if (!reviewer) {
        return res.status(404).json({ error: 'Reviewer not found' })
      }
      if (reviewer.authorId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      // Result is stored once: never regenerate blindly, regen needs confirm.
      const existing = await flashcardModel.findByReviewer(reviewerId)
      if (existing.length > 0 && !wantsOverwrite(confirm)) {
        return res.status(409).json({
          error: 'Deck already generated. Confirm overwrite to regenerate.',
          regenerateRequiresConfirm: true,
          cardCount: existing.length,
        })
      }
    }

    // Check deck quota
    const hasQuota = await checkQuota(req.user.id, DECK_QUOTA_LIMIT)
    if (!hasQuota) {
      return res.status(429).json({
        error: 'AI deck generation limit reached',
        remaining: 0,
        limit: DECK_QUOTA_LIMIT,
      })
    }

    // Extract text from file (simplified - in production use pdf-parse or similar)
    const text = extractTextFromFile(file)

    // Generate flashcard deck + blurting prompts (quota consumed only on success)
    let deck
    try {
      deck = await extractDeckAndPrompts(text, {
        courseCode: req.body.courseCode,
        courseDescription: req.body.courseDescription,
        examType: req.body.examType,
      })
    } catch (error) {
      if (error.code === 'DECK_PARSE_FAILED') {
        // File is kept; user can add cards manually.
        const remaining = await getRemainingQuota(req.user.id, DECK_QUOTA_LIMIT)
        return res.json({
          cards: [],
          prompts: [],
          saved: false,
          remaining,
          limit: DECK_QUOTA_LIMIT,
          trimmed: false,
          partial: false,
          notice: 'Could not read the AI output. Your file was kept — add cards manually.',
        })
      }
      // LLM timeout/failure consumes NO quota, retry allowed.
      return res.status(502).json({
        error: 'AI deck generation failed. No quota used — please retry.',
      })
    }

    const { cards, prompts, trimmed, partial } = deck

    // Increment quota usage (success only)
    await incrementUsage(req.user.id)

    // If reviewerId provided, store rows once (overwrite on confirmed regen)
    let saved = false
    if (reviewerId) {
      await flashcardModel.removeAllByReviewer(reviewerId)
      if (cards.length > 0) {
        const cardsToCreate = cards.map((card, index) => ({
          reviewerId,
          front: card.front,
          back: card.back,
          source: 'ai',
          sortOrder: index,
        }))
        await flashcardModel.createMany(cardsToCreate)
      }
      await reviewerModel.update(reviewerId, {
        aiPrompts: prompts,
        deckGeneratedAt: new Date(),
        deckStale: false,
      })
      delPrefix('reviewers:')
      saved = true
    }

    const remaining = await getRemainingQuota(req.user.id, DECK_QUOTA_LIMIT)

    res.json({
      cards,
      prompts,
      saved,
      remaining,
      limit: DECK_QUOTA_LIMIT,
      trimmed,
      ...(partial
        ? {
          partial: true,
          notice: 'Some AI output was skipped. Review the deck and add missing cards manually.',
        }
        : { partial: false }),
    })
  } catch (error) {
    console.error('AI deck extraction error:', error)
    res.status(500).json({ error: 'Failed to generate flashcard deck' })
  }
}

const getQuotaStatus = async (req, res) => {
  try {
    const remaining = await getRemainingQuota(req.user.id, DECK_QUOTA_LIMIT)
    res.json({
      remaining,
      limit: DECK_QUOTA_LIMIT,
      configured: isConfigured(),
    })
  } catch (error) {
    console.error('Quota status error:', error)
    res.status(500).json({ error: 'Failed to get quota status' })
  }
}

const extractTextFromFile = (file) => {
  // Simplified text extraction - in production use proper parsers
  if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf-8')
  }

  // For PDF/PPTX, we'd use pdf-parse or pptx-parser
  // For now, return a placeholder
  return `[Content from ${file.originalname}]\n\nThis is a placeholder for the actual content extraction. In production, this would use pdf-parse or similar library to extract text from ${file.mimetype} files.`
}

export { extractFromUpload, getQuotaStatus }
