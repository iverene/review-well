import express from 'express'
import {
  googleAuth,
  googleCallback,
  googleCallbackHandler,
  logout,
  getMe,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const app = express.Router()

// Google OAuth routes
app.get('/google', googleAuth)
app.get('/google/callback', googleCallback, googleCallbackHandler)

// Protected routes
app.post('/logout', requireAuth, logout)
app.get('/me', requireAuth, getMe)

export default app