import express from 'express'
import { getProfile, updateProfile, updateAvatar, getMyProfile, searchUsers, getAnnouncement, dismissAnnouncement } from '../controllers/profileController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { uploadAvatar, handleUploadError } from '../middleware/upload.js'
import { validateBody } from '../middleware/validate.js'
import { updateProfileSchema } from '../validators/profile.js'

const app = express.Router()

// My profile
app.get('/me', requireAuth, getMyProfile)
app.put('/me', requireAuth, validateBody(updateProfileSchema), updateProfile)
app.put('/me/avatar', requireAuth, uploadAvatar.single('avatar'), handleUploadError, updateAvatar)

// Announcement dismissal sync (must precede /:userId)
app.get('/me/announcement', requireAuth, getAnnouncement)
app.put('/me/announcement', requireAuth, dismissAnnouncement)

// Find friends
app.get('/search', requireAuth, searchUsers)

// Public profile
app.get('/:userId', optionalAuth, getProfile)

export default app