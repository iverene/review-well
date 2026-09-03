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
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-md rounded border border-stone bg-paper p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-ink">Review Well</h1>
          <p className="mt-2 text-muted">Sign in to create and manage study guides</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <LoginButton />
          <button
            onClick={() => {
              continueAsGuest()
              navigate(from, { replace: true })
            }}
            className="rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
          >
            Continue as Guest
          </button>
          <p className="text-xs text-muted">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
