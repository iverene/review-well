const express = require('express')
const router = express.Router()
const { extractFromUpload, getQuotaStatus } = require('../controllers/aiController')
const { requireAuth } = require('../middleware/auth')
const { upload, handleUploadError } = require('../middleware/upload')

// Protected routes
router.post(
  '/extract',
  requireAuth,
  upload.single('file'),
  handleUploadError,
  extractFromUpload
)

router.get('/quota', requireAuth, getQuotaStatus)

module.exports = router
