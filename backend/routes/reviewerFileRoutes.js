import express from 'express'
import {
  uploadReviewerFile,
  replaceReviewerFile,
} from '../controllers/reviewerFileController.js'
import { uploadReviewerFile as reviewerUpload, handleReviewerFileUploadError } from '../middleware/upload.js'

const app = express.Router()

// Guest writes are blocked with 401 guest-write-blocked — BEFORE multer, so
// guests never pay the cost of buffering an upload (and get 401, not 400,
// even for disallowed file types). Mirrors `requireAuth` style in
// middleware/auth.js but keeps the spec's guest-write-blocked shape; the
// controller check remains as defense-in-depth. `requireAuth` itself is
// untouched.
const requireSignedIn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'guest-write-blocked' })
  }
  next()
}

app.post(
  '/',
  requireSignedIn,
  reviewerUpload.single('file'),
  handleReviewerFileUploadError,
  uploadReviewerFile
)
app.put(
  '/:reviewerId',
  requireSignedIn,
  reviewerUpload.single('file'),
  handleReviewerFileUploadError,
  replaceReviewerFile
)

export default app
