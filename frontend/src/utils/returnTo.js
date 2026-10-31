// Where to land after Google sign-in. The OAuth round trip leaves the SPA,
// so the target survives in sessionStorage (same tab only) until the
// callback — or onboarding, for first-time users — consumes it.

const RETURN_TO_KEY = 'review-well-return-to'

// Internal paths only, so a crafted link can't bounce users off-site.
export const safeInternalPath = (path) => (
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : null
)

export const rememberReturnTo = (path) => {
  try {
    const safe = safeInternalPath(path)
    if (safe && safe !== '/') window.sessionStorage.setItem(RETURN_TO_KEY, safe)
    else window.sessionStorage.removeItem(RETURN_TO_KEY)
  } catch {
    // Storage blocked — sign-in still works and lands on home.
  }
}

export const takeReturnTo = () => {
  try {
    const path = safeInternalPath(window.sessionStorage.getItem(RETURN_TO_KEY))
    window.sessionStorage.removeItem(RETURN_TO_KEY)
    return path
  } catch {
    return null
  }
}
