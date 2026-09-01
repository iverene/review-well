const getPublicReviewers = async (req, res) => {
  // TODO: Fetch public reviewers with pagination
  res.status(501).json({ error: 'Not implemented' })
}

const getMyReviewers = async (req, res) => {
  // TODO: Fetch current user's reviewers
  res.status(501).json({ error: 'Not implemented' })
}

const getReviewerById = async (req, res) => {
  // TODO: Fetch single reviewer by ID
  res.status(501).json({ error: 'Not implemented' })
}

const createReviewer = async (req, res) => {
  // TODO: Create new reviewer
  res.status(501).json({ error: 'Not implemented' })
}

const updateReviewer = async (req, res) => {
  // TODO: Update reviewer metadata
  res.status(501).json({ error: 'Not implemented' })
}

const deleteReviewer = async (req, res) => {
  // TODO: Delete reviewer and cascade blocks
  res.status(501).json({ error: 'Not implemented' })
}

module.exports = {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
}
