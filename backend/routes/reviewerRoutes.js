import express from 'express'
import {
  getPublicReviewers,
  getAuthorReviewers,
  getMyReviewers,
  getReadableIds,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
} from '../controllers/reviewerController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import {
  createReviewerSchema,
  updateReviewerSchema,
} from '../validators/reviewer.js'

const app = express.Router()

// Public routes
app.get('/public', getPublicReviewers)
app.get('/author/:userId', getAuthorReviewers)

// Protected routes - require authentication
app.get('/my', requireAuth, getMyReviewers)
app.post(
  '/',
  requireAuth,
  validateBody(createReviewerSchema),
  createReviewer
)

// Routes with optional authentication (for access control)
// NOTE: /exists must stay above /:id so Express matches it literally.
app.get('/exists', optionalAuth, getReadableIds)
app.get('/:id', optionalAuth, getReviewerById)
app.put(
  '/:id',
  requireAuth,
  validateBody(updateReviewerSchema),
  updateReviewer
)
app.delete('/:id', requireAuth, deleteReviewer)

export default app