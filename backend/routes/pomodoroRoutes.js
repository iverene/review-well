import express from 'express'
import {
  createSession,
  getStats,
  updateGoal,
} from '../controllers/pomodoroController.js'

const app = express.Router()

// Guest writes are blocked with 401 guest-write-blocked — same
// `requireSignedIn`-before-handler pattern as blurtingRoutes.js. Stats and
// the goal are per-user so reads also require a signed-in user. Guests run
// the timer fully client-side and never POST. The controller check remains
// as defense-in-depth.
const requireSignedIn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'guest-write-blocked' })
  }
  next()
}

// Full paths: mounted at /api in server.js so the final URLs are exactly
// POST /api/pomodoro/sessions, GET /api/pomodoro/stats and
// PATCH /api/users/me/goal.
app.post('/pomodoro/sessions', requireSignedIn, createSession)
app.get('/pomodoro/stats', requireSignedIn, getStats)
app.patch('/users/me/goal', requireSignedIn, updateGoal)

export default app
