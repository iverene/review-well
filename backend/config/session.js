import cookieSession from 'cookie-session'

const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production (unpredictable sessions otherwise)')
}

// Stateless signed-cookie sessions: no server-side store, so sign-in
// survives across serverless function instances (MemoryStore does not).
// The cookie is re-issued on every response, refreshing the 7-day rolling
// expiry below. A separate absolute cap (30 days from login) is enforced by
// enforceAbsoluteSessionExpiry so active stolen sessions still expire.
const sessionConfig = cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'dev-secret-change-in-production'],
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, rolling
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

// Absolute session lifetime: rolling cookie expiry alone lets an active
// stolen session live forever, so the login moment is stamped once and any
// session older than 30 days is destroyed regardless of activity. Runs
// after passport.session() so req.user is populated. Never blocks the
// request on bookkeeping failures.
const ABSOLUTE_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const enforceAbsoluteSessionExpiry = (req, res, next) => {
  try {
    if (!req.user) return next()
    const now = Date.now()
    if (!req.session || typeof req.session.loginAt !== 'number') {
      if (req.session) req.session.loginAt = now
      return next()
    }
    if (now - req.session.loginAt <= ABSOLUTE_SESSION_MAX_AGE_MS) return next()
    const finish = () => {
      req.session = null
      next()
    }
    if (typeof req.logout === 'function') {
      req.logout(() => finish())
    } else {
      req.user = null
      finish()
    }
  } catch {
    next()
  }
}

export { sessionConfig, ensureSessionCompat, enforceAbsoluteSessionExpiry, ABSOLUTE_SESSION_MAX_AGE_MS }
