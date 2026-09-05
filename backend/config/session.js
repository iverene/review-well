import cookieSession from 'cookie-session'

const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production (unpredictable sessions otherwise)')
}

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

// Passport 0.7 calls req.session.regenerate() (fixation guard) and
// req.session.save() (flush) on login and logout. cookie-session is
// stateless, so both are safe no-ops: there is no server-side id to rotate
// (the signed cookie content itself is replaced at login, which an attacker
// cannot forge without the secret), and persistence happens automatically
// via the Set-Cookie response header. Never overrides a real store.
const ensureSessionCompat = (req, res, next) => {
  if (req.session) {
    if (typeof req.session.regenerate !== 'function') {
      req.session.regenerate = (callback) => callback(null)
    }
    if (typeof req.session.save !== 'function') {
      req.session.save = (callback) => callback(null)
    }
  }
  next()
}

export { sessionConfig, ensureSessionCompat }
