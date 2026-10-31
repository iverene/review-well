import { useState, useEffect } from 'react'
import axios from 'axios'
import { UserCheck, UserPlus } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { buttonClasses } from '../common/Button'
import useQueryCache from '../../stores/queryCache'

const FollowButton = ({ userId, initialFollowing, initialFollowerCount = 0, onToggle }) => {
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const [following, setFollowing] = useState(initialFollowing ?? false)
  const [, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)

  const isOwnProfile = user?.id === userId

  useEffect(() => {
    if (initialFollowing !== undefined) setFollowing(initialFollowing)
  }, [initialFollowing])

  useEffect(() => {
    // Parents that already know the relationship (list/detail payloads) can
    // pass it in; fetching it again would repeat the same query per row.
    if (!isAuthenticated || isOwnProfile || initialFollowing !== undefined) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await axios.get(`/api/social/users/${userId}/follow`, {
          withCredentials: true,
        })
        if (cancelled) return
        setFollowing(response.data.following)
        setFollowerCount(response.data.followerCount)
      } catch (error) {
        if (cancelled) return
        console.error('Failed to fetch follow status:', error)
        toast.error(getApiErrorMessage(error, 'Unable to load follow status.'))
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId, isAuthenticated, isOwnProfile, initialFollowing])

  const handleFollow = async () => {
    if (!isAuthenticated || loading || isOwnProfile) return

    setLoading(true)
    try {
      const response = following
        ? await axios.delete(`/api/social/users/${userId}/follow`, {
          withCredentials: true,
        })
        : await axios.post(`/api/social/users/${userId}/follow`, {}, {
          withCredentials: true,
        })
      setFollowing(response.data.following)
      setFollowerCount(response.data.followerCount)
      useQueryCache.getState().invalidate('GET /api/social/users/')
      useQueryCache.getState().invalidate('GET /api/profile/')
      onToggle?.(response.data.following, response.data.followerCount)
      if (response.data.following) toast.success('Following')
      else toast.info('Unfollowed')
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      toast.error(getApiErrorMessage(error, 'Unable to update follow status.'))
    } finally {
      setLoading(false)
    }
  }

  if (isOwnProfile) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={!isAuthenticated || loading}
      aria-pressed={following}
      className={buttonClasses({ variant: following ? 'secondary' : 'primary' })}
    >
      {following ? (
        <UserCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <UserPlus className="h-4 w-4" aria-hidden="true" />
      )}
      {loading ? 'Saving…' : following ? 'Following' : 'Follow'}
    </button>
  )
}

export default FollowButton
