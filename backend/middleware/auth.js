const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  next()
}

const optionalAuth = (req, res, next) => {
  // Attach user if session exists, but don't block
  next()
}

module.exports = { requireAuth, optionalAuth }