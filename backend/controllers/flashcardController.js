import * as flashcardModel from '../models/flashcardModel.js'
import * as reviewerModel from '../models/reviewerModel.js'

const requireSignedIn = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'guest-write-blocked' })
    return false
  }
  return true
}

// Reads honor reviewer visibility (mirrors reviewerController.getReviewerById):
// public and unlisted-via-link are readable by anyone; private requires
// owner; drafts are owner-only (they never appear in public listings).
const canRead = (reviewer, user) => {
  if (!reviewer) return false
  if (reviewer.visibility === 'private' && reviewer.authorId !== user?.id) return false
  if (reviewer.isDraft && reviewer.authorId !== user?.id) return false
  return true
}

const getCards = async (req, res) => {
  try {
    const { id } = req.params
    const reviewer = await reviewerModel.findById(id)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (!canRead(reviewer, req.user)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const cards = await flashcardModel.findByReviewer(id)
    const known = cards.filter((card) => card.known).length
    res.json({ cards, known, total: cards.length })
  } catch (error) {
    console.error('Get flashcard deck error:', error)
    res.status(500).json({ error: 'Failed to fetch flashcards' })
  }
}

const createCard = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { id } = req.params
    const reviewer = await reviewerModel.findById(id)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this reviewer' })
    }

    const { front, back } = req.body || {}
    if (!front?.trim() || !back?.trim()) {
      return res.status(400).json({ error: 'front and back are required' })
    }

    const existing = await flashcardModel.findByReviewer(id)
    const card = await flashcardModel.createCard({
      reviewerId: id,
      front: front.trim(),
      back: back.trim(),
      source: 'manual',
      sortOrder: existing.length,
    })
    res.status(201).json({ card })
  } catch (error) {
    console.error('Create flashcard error:', error)
    res.status(500).json({ error: 'Failed to create flashcard' })
  }
}

const updateCard = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { cardId } = req.params
    const card = await flashcardModel.findCardById(cardId)
    if (!card) {
      return res.status(404).json({ error: 'Flashcard not found' })
    }
    const reviewer = await reviewerModel.findById(card.reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this reviewer' })
    }

    const { known, front, back } = req.body || {}
    if (typeof known === 'boolean' && front === undefined && back === undefined) {
      const updated = await flashcardModel.setKnown(cardId, known)
      return res.json({ card: updated })
    }

    const data = {}
    if (front !== undefined) {
      if (!front?.trim()) return res.status(400).json({ error: 'front cannot be empty' })
      data.front = front.trim()
    }
    if (back !== undefined) {
      if (!back?.trim()) return res.status(400).json({ error: 'back cannot be empty' })
      data.back = back.trim()
    }
    if (typeof known === 'boolean') data.known = known
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const updated = await flashcardModel.updateCard(cardId, data)
    res.json({ card: updated })
  } catch (error) {
    console.error('Update flashcard error:', error)
    res.status(500).json({ error: 'Failed to update flashcard' })
  }
}

const deleteCard = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { cardId } = req.params
    const card = await flashcardModel.findCardById(cardId)
    if (!card) {
      return res.status(404).json({ error: 'Flashcard not found' })
    }
    const reviewer = await reviewerModel.findById(card.reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this reviewer' })
    }

    await flashcardModel.removeCard(cardId)
    res.json({ message: 'Flashcard deleted successfully' })
  } catch (error) {
    console.error('Delete flashcard error:', error)
    res.status(500).json({ error: 'Failed to delete flashcard' })
  }
}

export { getCards, createCard, updateCard, deleteCard }
