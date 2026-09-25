import express from 'express'
import {
  submitDump,
  getHistory,
  setSelfRating,
} from '../controllers/blurtingController.js'

const app = express.Router()

// Guest writes are blocked with 401 guest-write-blocked — same
// `requireSignedIn`-before-handler pattern as flashcardRoutes.js. History is
// per-user so it also requires a signed-in user. The controller check
// remains as defense-in-depth.
const requireSignedIn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'guest-write-blocked' })
  }
  next()
}

// Full paths: mounted at /api in server.js so the final URLs are exactly
// POST|GET /api/reviewers/:id/blurting and PATCH /api/blurting/:attemptId.
app.post('/reviewers/:id/blurting', requireSignedIn, submitDump)
app.get('/reviewers/:id/blurting', requireSignedIn, getHistory)
app.patch('/blurting/:attemptId', requireSignedIn, setSelfRating)

export default app
