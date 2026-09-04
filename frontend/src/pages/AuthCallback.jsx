import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import AuthLoading from '../components/auth/AuthLoading'
import ErrorAlert from '../components/common/ErrorAlert'
import { isProfileComplete } from '../utils/profile'

const AuthCallback = () => {
  const { refreshUser, loading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      const authenticated = await refreshUser()
      if (authenticated) {
        navigate(isProfileComplete(authenticated) ? '/' : '/onboarding', {
          replace: true,
          state: { onboarding: !isProfileComplete(authenticated) },
        })
      } else {
        setError('We could not complete Google sign-in. Please try again.')
      }
    }

    if (!loading) {
      handleCallback()
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
