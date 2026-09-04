import session from 'express-session'

const isProduction = process.env.NODE_ENV === 'production'

const sessionConfig = session({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  // Sliding expiration: active users stay signed in
  rolling: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: isProduction,
    httpOnly: true,
    // Split frontend/backend deployments need cross-site cookies in production
    sameSite: isProduction ? 'none' : 'lax',
  },
})

export { sessionConfig }