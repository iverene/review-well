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

// Logout is idempotent by design: an expired or missing session still
// succeeds so sign-out never traps the user in an error state
app.post('/logout', logout)
app.get('/me', requireAuth, getMe)

export default app