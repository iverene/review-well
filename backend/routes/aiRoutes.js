import express from 'express'
import { extractFromUpload, getQuotaStatus } from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'
import { upload, handleUploadError } from '../middleware/upload.js'

const app = express.Router()

// Protected routes
app.post(
  '/extract',
  requireAuth,
  upload.single('file'),
  handleUploadError,
  extractFromUpload
)

app.get('/quota', requireAuth, getQuotaStatus)

export default app