const express = require('express')
const router = express.Router()
const { googleAuth, googleCallback, googleCallbackHandler, logout, getMe } = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')

// Google OAuth routes
router.get('/google', googleAuth)
router.get('/google/callback', googleCallback, googleCallbackHandler)

// Protected routes
router.post('/logout', requireAuth, logout)
router.get('/me', requireAuth, getMe)

module.exports = router
