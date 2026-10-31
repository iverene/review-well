import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bookmark } from 'lucide-react'

import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { buttonClasses } from '../common/Button'
import useQueryCache from '../../stores/queryCache'

const SaveButton = ({ reviewerId, initialSaved, initialSaveCount = 0 }) => {
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [saved, setSaved] = useState(initialSaved ?? false)
  const [saveCount, setSaveCount] = useState(initialSaveCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialSaved !== undefined) setSaved(initialSaved)
  }, [initialSaved])

  useEffect(() => {
    if (initialSaveCount !== undefined) setSaveCount(initialSaveCount)
  }, [initialSaveCount])

  useEffect(() => {
    // Callers with a decorated list/detail payload already have this state;
    // only fetch when the parent genuinely does not know it.
    if (!isAuthenticated || initialSaved !== undefined) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await axios.get(`/api/social/reviewers/${reviewerId}/save`, {
          withCredentials: true,
        })
        if (cancelled) return
        setSaved(response.data.saved)
        setSaveCount(response.data.saveCount)
      } catch (error) {
        if (cancelled) return
        console.error('Failed to fetch save status:', error)
        toast.error(getApiErrorMessage(error, 'Unable to load save status.'))
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [reviewerId, isAuthenticated, initialSaved])

  const handleSave = async () => {
    if (!isAuthenticated || loading) return

    setLoading(true)
    try {
      if (saved) {
        const response = await axios.delete(`/api/social/reviewers/${reviewerId}/save`, {
          withCredentials: true,
        })
        setSaved(response.data.saved)
        setSaveCount(response.data.saveCount)
        useQueryCache.getState().invalidate('GET /api/social/saved')
        useQueryCache.getState().invalidate('GET /api/reviewers')
        toast.info('Removed From Saved')
      } else {
        const response = await axios.post(`/api/social/reviewers/${reviewerId}/save`, {}, {
          withCredentials: true,
        })
        setSaved(response.data.saved)
        setSaveCount(response.data.saveCount)
        useQueryCache.getState().invalidate('GET /api/social/saved')
        useQueryCache.getState().invalidate('GET /api/reviewers')
        toast.success('Saved to Your Library')
      }
    } catch (error) {
      console.error('Failed to toggle save:', error)
      toast.error(getApiErrorMessage(error, 'Unable to update saved status.'))
    } finally {
      setLoading(false)
    }
  }

  const count = <span className="font-mono text-xs">{saveCount}</span>

  // Guests can look but not save: send them to sign in and straight back.
  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
    return (
      <a
        href={`/login?returnTo=${returnTo}`}
        aria-label="Sign in to save this reviewer"
        title="Sign in to save this reviewer"
        className={buttonClasses()}
      >
        <Bookmark className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
        {count}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={loading}
      aria-pressed={saved}
      aria-label={saved ? 'Remove bookmark' : 'Bookmark this reviewer'}
      className={buttonClasses({ className: saved ? 'border-accent/50 bg-blush hover:bg-blush' : '' })}
    >
      <Bookmark
        className={`h-4 w-4 transition-transform duration-150 ${saved ? 'scale-110 text-accent' : ''}`}
        aria-hidden="true"
        fill={saved ? 'currentColor' : 'none'}
        strokeWidth={2.2}
      />
      {count}
    </button>
  )
}

export default SaveButton
