const express = require('express')
const router = express.Router()
const { getProfile, updateProfile, updateAvatar, getMyProfile } = require('../controllers/profileController')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { upload } = require('../middleware/upload')

// My profile
router.get('/me', requireAuth, getMyProfile)
router.put('/me', requireAuth, updateProfile)
router.put('/me/avatar', requireAuth, upload.single('avatar'), updateAvatar)

// Public profile
router.get('/:userId', optionalAuth, getProfile)

module.exports = router
