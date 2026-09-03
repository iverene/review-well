import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginButton from '../components/auth/LoginButton'

const Login = () => {
  const { isAuthenticated, isGuest, loading, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if ((isAuthenticated || isGuest) && !loading) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isGuest, loading, navigate, from])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-ink">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated || isGuest) {
    return null
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center py-6">
      <div className="club-surface w-full max-w-lg p-6 sm:p-10">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="" className="mx-auto mb-4 h-24 w-24 object-contain" />
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-accent">Welcome to the study club</p>
          <h1 className="text-4xl font-bold text-ink">Pick your study mode</h1>
          <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted">Make an account for the full toolkit, or browse public guides as a guest.</p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-soft border-2 border-stone bg-paper p-4 text-center">
            <p className="font-extrabold text-ink">Full access</p>
            <p className="mt-1 text-sm text-muted">Create, edit, save, and use AI study tools.</p>
            <div className="mt-3 flex justify-center"><LoginButton /></div>
          </div>
          <button
            onClick={() => {
              continueAsGuest()
              navigate(from, { replace: true })
            }}
            className="rounded-soft border-2 border-stone bg-powder px-4 py-3 text-sm font-extrabold text-ink transition-transform hover:-translate-y-0.5 hover:bg-powder"
          >
            Browse as Guest
          </button>
          <p className="pt-2 text-center text-xs text-muted">Guest mode is view-only and does not create an account.</p>
        </div>
      </div>
    </div>
  )
}

export default Login
