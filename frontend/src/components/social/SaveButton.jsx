import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bookmark } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import ErrorAlert from '../common/ErrorAlert'
import { getApiErrorMessage } from '../../utils/apiError'

const SaveButton = ({ reviewerId, initialSaved = false, initialSaveCount = 0 }) => {
  const { isAuthenticated } = useAuth()
  const [saved, setSaved] = useState(initialSaved)
  const [saveCount, setSaveCount] = useState(initialSaveCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchSaveStatus()
    }
  }, [reviewerId, isAuthenticated])

  const fetchSaveStatus = async () => {
    try {
      const response = await axios.get(`/api/social/reviewers/${reviewerId}/save`, {
        withCredentials: true,
      })
      setSaved(response.data.saved)
      setSaveCount(response.data.saveCount)
    } catch (error) {
      console.error('Failed to fetch save status:', error)
      setError(getApiErrorMessage(error, 'Unable to load save status.'))
    }
  }

  const handleSave = async () => {
    if (!isAuthenticated || loading) return

    setLoading(true)
    setError(null)
    try {
      if (saved) {
        const response = await axios.delete(`/api/social/reviewers/${reviewerId}/save`, {
          withCredentials: true,
        })
        setSaved(response.data.saved)
        setSaveCount(response.data.saveCount)
      } else {
        const response = await axios.post(`/api/social/reviewers/${reviewerId}/save`, {}, {
          withCredentials: true,
        })
        setSaved(response.data.saved)
        setSaveCount(response.data.saveCount)
      }
    } catch (error) {
      console.error('Failed to toggle save:', error)
      setError(getApiErrorMessage(error, 'Unable to update saved status.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSave}
        disabled={!isAuthenticated || loading}
        aria-pressed={saved}
        aria-label={saved ? 'Remove bookmark' : 'Bookmark this reviewer'}
        className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide shadow-sm transition-all duration-200 active:scale-95 ${
          saved
            ? 'border-accent/40 bg-blush/80 text-ink shadow-blush/20 hover:bg-blush'
            : 'border-stone/60 bg-paper text-ink hover:border-stone hover:bg-stone/40'
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Bookmark
          className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 ${saved ? 'text-accent' : 'text-stone'}`}
          aria-hidden="true"
          fill={saved ? 'currentColor' : 'none'}
          strokeWidth={2}
        />
        <span className="font-semibold">{saveCount}</span>
      </button>
      <ErrorAlert className="mt-2 max-w-xs">{error}</ErrorAlert>
    </div>
  )
}

export default SaveButton
