import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'
import ErrorAlert from '../common/ErrorAlert'
import { getApiErrorMessage } from '../../utils/apiError'

const LikeButton = ({ reviewerId, initialLiked = false, initialLikeCount = 0 }) => {
  const { isAuthenticated } = useAuth()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchLikeStatus()
    }
  }, [reviewerId, isAuthenticated])

  const fetchLikeStatus = async () => {
    try {
      const response = await axios.get(`/api/social/reviewers/${reviewerId}/like`, {
        withCredentials: true,
      })
      setLiked(response.data.liked)
      setLikeCount(response.data.likeCount)
    } catch (error) {
      console.error('Failed to fetch like status:', error)
      setError(getApiErrorMessage(error, 'Unable to load like status.'))
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated || loading) return

    setLoading(true)
    setError(null)
    try {
      if (liked) {
        const response = await axios.delete(`/api/social/reviewers/${reviewerId}/like`, {
          withCredentials: true,
        })
        setLiked(response.data.liked)
        setLikeCount(response.data.likeCount)
      } else {
        const response = await axios.post(`/api/social/reviewers/${reviewerId}/like`, {}, {
          withCredentials: true,
        })
        setLiked(response.data.liked)
        setLikeCount(response.data.likeCount)
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      setError(getApiErrorMessage(error, 'Unable to update like status.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleLike}
        disabled={!isAuthenticated || loading}
        className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm transition-colors ${
        liked
          ? 'border-ink bg-ink text-paper'
          : 'border-stone bg-paper text-ink hover:bg-stone'
        } disabled:opacity-50`}
      >
        <svg
          className={`h-4 w-4 ${liked ? 'fill-current' : ''}`}
          fill={liked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{likeCount}</span>
      </button>
      <ErrorAlert className="mt-2 max-w-xs">{error}</ErrorAlert>
    </div>
  )
}

export default LikeButton
