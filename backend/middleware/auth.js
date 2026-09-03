import * as userModel from '../models/userModel.js'

const requireAuth = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

const optionalAuth = async (req, res, next) => {
  if (req.user) {
    try {
      const user = await userModel.getProfile(req.user.id)
      req.userProfile = user
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }
  next()
}

export { requireAuth, optionalAuth }