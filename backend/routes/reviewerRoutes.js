const express = require('express')
const router = express.Router()
const {
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
} = require('../controllers/reviewerController')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { validateBody } = require('../middleware/validate')
const {
  createReviewerSchema,
  updateReviewerSchema,
  createBlockSchema,
  updateBlockSchema,
  reorderBlocksSchema,
} = require('../validators/reviewer')

// Public routes
router.get('/public', getPublicReviewers)

// Protected routes - require authentication
router.get('/my', requireAuth, getMyReviewers)
router.post('/', requireAuth, validateBody(createReviewerSchema), createReviewer)

// Routes with optional authentication (for access control)
router.get('/:id', optionalAuth, getReviewerById)
router.put('/:id', requireAuth, validateBody(updateReviewerSchema), updateReviewer)
router.delete('/:id', requireAuth, deleteReviewer)

// Block routes
router.post('/:reviewerId/blocks', requireAuth, validateBody(createBlockSchema), addBlock)
router.put('/blocks/:blockId', requireAuth, validateBody(updateBlockSchema), updateBlock)
router.delete('/blocks/:blockId', requireAuth, deleteBlock)
router.put('/:reviewerId/blocks/reorder', requireAuth, validateBody(reorderBlocksSchema), reorderBlocks)

module.exports = router
