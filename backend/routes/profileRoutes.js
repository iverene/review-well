import express from 'express'
import { getProfile, updateProfile, updateAvatar, getMyProfile, searchUsers } from '../controllers/profileController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { uploadAvatar, handleUploadError } from '../middleware/upload.js'

const app = express.Router()

// My profile
app.get('/me', requireAuth, getMyProfile)
app.put('/me', requireAuth, updateProfile)
app.put('/me/avatar', requireAuth, uploadAvatar.single('avatar'), handleUploadError, updateAvatar)

// Find friends
app.get('/search', requireAuth, searchUsers)

// Public profile
app.get('/:userId', optionalAuth, getProfile)

export default app