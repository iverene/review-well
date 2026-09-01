const validateBody = (schema) => {
  return (req, res, next) => {
    // TODO: Implement schema validation with zod or joi
    next()
  }
}

module.exports = { validateBody }