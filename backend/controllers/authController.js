import passport from 'passport'
import * as userModel from '../models/userModel.js'
import { getFrontendRedirect } from '../config/urls.js'

const googleAuth = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next)
}

const googleCallback = (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: getFrontendRedirect('/login'),
    failureMessage: true,
  })(req, res, next)
}

const googleCallbackHandler = (req, res) => {
  res.redirect(getFrontendRedirect('/auth/callback'))
}

const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' })
    }
    // cookie-session is stateless: nulling the session clears the cookie,
    // with no server-side store to destroy
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
