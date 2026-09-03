import express from 'express'
import {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
  addBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
} from '../controllers/reviewerController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import {
  createReviewerSchema,
  updateReviewerSchema,
  createBlockSchema,
  updateBlockSchema,
  reorderBlocksSchema,
} from '../validators/reviewer.js'

const app = express.Router()

// Public routes
app.get('/public', getPublicReviewers)

// Protected routes - require authentication
app.get('/my', requireAuth, getMyReviewers)
app.post(
  '/',
  requireAuth,
  validateBody(createReviewerSchema),
  createReviewer
)

// Routes with optional authentication (for access control)
app.get('/:id', optionalAuth, getReviewerById)
app.put(
  '/:id',
  requireAuth,
  validateBody(updateReviewerSchema),
  updateReviewer
)
app.delete('/:id', requireAuth, deleteReviewer)

// Block routes
app.post(
  '/:reviewerId/blocks',
  requireAuth,
  validateBody(createBlockSchema),
  addBlock
)
app.put(
  '/blocks/:blockId',
  requireAuth,
  validateBody(updateBlockSchema),
  updateBlock
)
app.delete('/blocks/:blockId', requireAuth, deleteBlock)
app.put(
  '/:reviewerId/blocks/reorder',
  requireAuth,
  validateBody(reorderBlocksSchema),
  reorderBlocks
)

export default app