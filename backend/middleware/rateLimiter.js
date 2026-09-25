import rateLimit from 'express-rate-limit'

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
})

const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many write operations, please slow down' },
})

export { globalLimiter, authLimiter, writeLimiter }
