import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { Skeleton } from '../components/common/Skeleton'
import LoginButton from '../components/auth/LoginButton'

// Protected routes (mirrors App.jsx guards) that a guest must never be sent
// to — bouncing there re-triggers ProtectedRoute and loops the browser into
// throttled navigation. Bare /profile is protected; /profile/:userId is public.
const GUEST_BLOCKED_PREFIXES = [
  '/reviewer/my',
  '/create',
  '/notifications',
  '/friends',
  '/settings',
  '/onboarding',
]

export const isGuestSafePath = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false
  if (path === '/profile' || path.startsWith('/profile?')) return false
  return !GUEST_BLOCKED_PREFIXES.some(
    (blocked) => path === blocked || path.startsWith(`${blocked}/`) || path.startsWith(`${blocked}?`)
  )
}

const Login = () => {
  const { isAuthenticated, loading, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Guest nudges link here as `/login?returnTo=<hub URL>`; ProtectedRoute
  // redirects use `location.state.from`. Prefer the query param, accept only
  // internal paths so a crafted link can't bounce users off-site.
  const searchParams = new URLSearchParams(location.search)
  const returnTo = searchParams.get('returnTo')
  // ProtectedRoute passes `from` as a string path (pathname + search +
  // hash); older entries may hold a location object — accept both.
  const stateFrom = location.state?.from
  const statePath = typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname
  const from = (returnTo?.startsWith('/') && !returnTo.startsWith('//'))
    ? returnTo
    : statePath || '/'

  useEffect(() => {
    // Authenticated users bounce straight through. Guests always see this
    // screen — auto-sending them onward re-triggers ProtectedRoute and loops
    // the browser into throttled navigation.
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, from])

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-md space-y-5 px-4 py-20" role="status" aria-label="Loading sign in"><Skeleton className="mx-auto h-20 w-20 rounded-full" /><Skeleton className="h-10 w-3/4 mx-auto" /><Skeleton className="h-14 w-full" /></div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center py-6">
      <div className="club-surface w-full max-w-lg p-6 sm:p-10">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="" className="mx-auto mb-4 h-16 w-16 object-contain md:h-24 md:w-24" />
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-accent">Welcome to the study club</p>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl md:text-4xl">Pick Your Study Mode</h1>
          <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">Make an account for the full toolkit, or browse public guides as a guest.</p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-soft border-2 border-stone bg-paper p-4 text-center">
            <p className="font-extrabold text-ink">Full Access</p>
            <p className="mt-1 text-sm text-muted">Create, edit, save, and use AI study tools.</p>
            <div className="mt-3 flex justify-center"><LoginButton /></div>
          </div>
          <button
            onClick={() => {
              continueAsGuest()
              // Guests can never land on protected routes — sending them
              // there re-triggers ProtectedRoute and loops navigation.
              navigate(isGuestSafePath(from) ? from : '/', { replace: true })
            }}
            className="rounded-soft border-2 border-stone bg-powder px-4 py-3 text-sm font-extrabold text-ink transition-transform hover:-translate-y-0.5 hover:bg-powder"
          >
            Browse as Guest
          </button>
          <p className="pt-2 text-center text-xs text-muted">Guest mode is view-only and does not create an account.</p>
          <p className="pt-3 text-center text-xs text-muted">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="font-bold text-accent hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="font-bold text-accent hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
