const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body)
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        return res.status(400).json({ error: 'Validation failed', errors })
      }
      req.validatedBody = result.data
      next()
    } catch (error) {
      next(error)
    }
  }
}

const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params)
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        return res.status(400).json({ error: 'Invalid parameters', errors })
      }
      req.validatedParams = result.data
      next()
    } catch (error) {
      next(error)
    }
  }
}

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query)
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        return res.status(400).json({ error: 'Invalid query parameters', errors })
      }
      req.validatedQuery = result.data
      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = { validateBody, validateParams, validateQuery }
