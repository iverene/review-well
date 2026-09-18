import express from 'express'
import {
  uploadReviewerFile,
  replaceReviewerFile,
} from '../controllers/reviewerFileController.js'
import { uploadReviewerFile as reviewerUpload, handleReviewerFileUploadError } from '../middleware/upload.js'

const app = express.Router()

// Guest writes are blocked inside the controllers with 401 guest-write-blocked
// (deliberately not `requireAuth`, whose 401 shape is 'Authentication required').
app.post(
  '/',
  reviewerUpload.single('file'),
  handleReviewerFileUploadError,
  uploadReviewerFile
)
app.put(
  '/:reviewerId',
  reviewerUpload.single('file'),
  handleReviewerFileUploadError,
  replaceReviewerFile
)

export default app
