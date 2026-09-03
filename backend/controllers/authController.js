import passport from 'passport'
import * as userModel from '../models/userModel.js'

const googleAuth = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next)
}

const googleCallback = (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
    failureMessage: true,
  })(req, res, next)
}

const googleCallbackHandler = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  res.redirect(`${frontendUrl}/auth/callback`)
}

const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' })
    }
    req.session = null
    res.json({ message: 'Logged out successfully' })
  })
}

const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const user = await userModel.getProfile(req.user.id)
    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
}

export { googleAuth, googleCallback, googleCallbackHandler, logout, getMe }
