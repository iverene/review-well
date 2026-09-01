const express = require('express')
const router = express.Router()
const { requestVerification, verifyEmail, unsubscribe } = require('../controllers/emailController')

// Public routes
router.post('/verify/request', requestVerification)
router.get('/verify/:token', verifyEmail)
router.get('/unsubscribe/:email/:token', unsubscribe)

module.exports = router
