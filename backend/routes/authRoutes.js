const express = require('express')
const router = express.Router()
const { googleAuth, logout, getMe } = require('../controllers/authController')

router.post('/google', googleAuth)
router.post('/logout', logout)
router.get('/me', getMe)

module.exports = router
