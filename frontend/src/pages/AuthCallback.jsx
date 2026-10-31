import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import AuthLoading from '../components/auth/AuthLoading'
import ErrorAlert from '../components/common/ErrorAlert'
import { isProfileComplete } from '../utils/profile'
import { takeReturnTo } from '../utils/returnTo'

const AuthCallback = () => {
  const { refreshUser, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    // A superseded run (StrictMode's double effect, or a re-render while the
    // session check is in flight) must not navigate or consume returnTo.
    let cancelled = false
    const handleCallback = async () => {
      const authenticated = await refreshUser()
      if (cancelled) return
      if (authenticated) {
        // First-time users finish onboarding first; it consumes the
        // remembered page when they enter the app.
        if (isProfileComplete(authenticated)) {
          navigate(takeReturnTo() || '/', { replace: true })
        } else {
          navigate('/onboarding', { replace: true, state: { onboarding: true } })
        }
      } else {
        setError('We could not complete Google sign-in. Please try again.')
      }
    }

    if (!loading) {
      handleCallback()
    }
    return () => {
      cancelled = true
    }
  }, [refreshUser, navigate, loading])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <ErrorAlert>{error}</ErrorAlert>
          <button onClick={() => navigate('/login')} className="mt-4 text-sm font-bold text-ink hover:underline">
            Return to sign in
          </button>
        </div>
      </div>
    )
  }

  return <AuthLoading />
}

export default AuthCallback
