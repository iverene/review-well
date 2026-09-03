import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isProfileComplete } from '../../utils/profile'
import { Skeleton } from '../common/Skeleton'

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl space-y-5 px-4 py-20" role="status" aria-label="Loading account"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 w-full" /></div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!['/settings', '/onboarding'].includes(location.pathname) && !isProfileComplete(user)) {
    return <Navigate to="/settings" state={{ onboarding: true }} replace />
  }

  return children
}

export default ProtectedRoute
