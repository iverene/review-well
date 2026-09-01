const express = require('express')
const router = express.Router()
const {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
} = require('../controllers/reviewerController')

router.get('/public', getPublicReviewers)
router.get('/my', getMyReviewers)
router.get('/:id', getReviewerById)
router.post('/', createReviewer)
router.put('/:id', updateReviewer)
router.delete('/:id', deleteReviewer)

module.exports = router
