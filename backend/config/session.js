import cookieSession from 'cookie-session'

const isProduction = process.env.NODE_ENV === 'production'

// Stateless signed-cookie sessions: no server-side store, so sign-in
// survives across serverless function instances (MemoryStore does not).
// The cookie is re-issued on every response, refreshing the 24h expiry.
const sessionConfig = cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'dev-secret-change-in-production'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  secure: isProduction,
  httpOnly: true,
  // Split frontend/backend deployments need cross-site cookies in production
  sameSite: isProduction ? 'none' : 'lax',
})

export { sessionConfig }
