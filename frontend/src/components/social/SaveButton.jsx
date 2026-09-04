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
        className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm transition-colors ${
        saved
          ? 'border-accent bg-blush text-ink'
          : 'border-stone bg-paper text-ink hover:bg-stone'
        } disabled:opacity-50`}
      >
        <Bookmark
          className="h-4 w-4"
          aria-hidden="true"
          fill={saved ? 'currentColor' : 'none'}
          strokeWidth={2.2}
        />
        <span>{saveCount}</span>
      </button>
      <ErrorAlert className="mt-2 max-w-xs">{error}</ErrorAlert>
    </div>
  )
}

export default SaveButton
