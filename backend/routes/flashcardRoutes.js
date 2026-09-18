import express from 'express'
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
} from '../controllers/flashcardController.js'

const app = express.Router()

// Guest writes are blocked with 401 guest-write-blocked — same
// `requireSignedIn`-before-handler pattern as reviewerFileRoutes.js. The
// controller check remains as defense-in-depth.
const requireSignedIn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'guest-write-blocked' })
  }
  next()
}

// Full paths: mounted at /api in server.js so the final URLs are exactly
// GET|POST /api/reviewers/:id/cards and PATCH|DELETE /api/cards/:cardId.
app.get('/reviewers/:id/cards', getCards)
app.post('/reviewers/:id/cards', requireSignedIn, createCard)
app.patch('/cards/:cardId', requireSignedIn, updateCard)
app.delete('/cards/:cardId', requireSignedIn, deleteCard)

export default app
