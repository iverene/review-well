const googleAuth = async (req, res) => {
  // TODO: Verify Google token, create/find user, establish session
  res.status(501).json({ error: 'Not implemented' })
}

const logout = async (req, res) => {
  // TODO: Destroy session
  res.status(501).json({ error: 'Not implemented' })
}

const getMe = async (req, res) => {
  // TODO: Return current user from session
  res.status(501).json({ error: 'Not implemented' })
}

module.exports = { googleAuth, logout, getMe }
