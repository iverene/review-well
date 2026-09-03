import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import ErrorAlert from '../common/ErrorAlert'
import { getApiErrorMessage } from '../../utils/apiError'

const FollowButton = ({ userId, initialFollowing = false, initialFollowerCount = 0 }) => {
  const { user, isAuthenticated } = useAuth()
  const [following, setFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isOwnProfile = user?.id === userId

  useEffect(() => {
    if (isAuthenticated && !isOwnProfile) {
      fetchFollowStatus()
    }
  }, [userId, isAuthenticated, isOwnProfile])

  const fetchFollowStatus = async () => {
    try {
      const response = await axios.get(`/api/social/users/${userId}/follow`, {
        withCredentials: true,
      })
      setFollowing(response.data.following)
      setFollowerCount(response.data.followerCount)
    } catch (error) {
      console.error('Failed to fetch follow status:', error)
      setError(getApiErrorMessage(error, 'Unable to load follow status.'))
    }
  }

  const handleFollow = async () => {
    if (!isAuthenticated || loading || isOwnProfile) return

    setLoading(true)
    setError(null)
    try {
      if (following) {
        const response = await axios.delete(`/api/social/users/${userId}/follow`, {
          withCredentials: true,
        })
        setFollowing(response.data.following)
        setFollowerCount(response.data.followerCount)
      } else {
        const response = await axios.post(`/api/social/users/${userId}/follow`, {}, {
          withCredentials: true,
        })
        setFollowing(response.data.following)
        setFollowerCount(response.data.followerCount)
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      setError(getApiErrorMessage(error, 'Unable to update follow status.'))
    } finally {
      setLoading(false)
    }
  }

  if (isOwnProfile) {
    return null
  }

  return (
    <div>
      <button
        onClick={handleFollow}
        disabled={!isAuthenticated || loading}
        className={`rounded border px-4 py-2 text-sm transition-colors ${
        following
          ? 'border-stone bg-paper text-ink hover:bg-stone'
          : 'border-ink bg-ink text-paper hover:bg-stone'
        } disabled:opacity-50`}
      >
        {loading ? '...' : following ? 'Following' : 'Follow'}
      </button>
      <ErrorAlert className="mt-2 max-w-xs">{error}</ErrorAlert>
    </div>
  )
}

export default FollowButton
