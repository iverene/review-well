const extractFromUpload = async (req, res) => {
  // TODO: Check quota, parse PDF/PPTX, call LLM, return blocks
  res.status(501).json({ error: 'Not implemented' })
}

module.exports = { extractFromUpload }
