import express from 'express'
import { extractFromUpload, getQuotaStatus } from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadReviewerFile, handleReviewerFileUploadError } from '../middleware/upload.js'

const app = express.Router()

// Protected routes
app.post(
  '/extract',
  requireAuth,
  uploadReviewerFile.single('file'),
  handleReviewerFileUploadError,
  extractFromUpload
)

app.get('/quota', requireAuth, getQuotaStatus)

export default app