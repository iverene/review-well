import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

function Reviewer() {
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const saveRecentReviewer = async () => {
      try {
        const response = await fetch(`/api/reviewers/${window.location.pathname.split('/').pop()}`, { credentials: 'include' })
        if (!response.ok) return
        const { reviewer } = await response.json()
        const recent = JSON.parse(window.localStorage.getItem(recentReviewersKey(user.id)) || '[]')
        const withoutCurrent = recent.filter((item) => item.id !== reviewer.id)
        window.localStorage.setItem(recentReviewersKey(user.id), JSON.stringify([reviewer, ...withoutCurrent].slice(0, 5)))
      } catch (error) {
        console.error('Failed to save recent reviewer:', error)
      }
    }

    if (isAuthenticated && user?.id) saveRecentReviewer()
  }, [isAuthenticated, user])

  return (
    <div>
      <h2 className="text-3xl font-semibold text-ink mb-4">Reviewer</h2>
      <p className="text-muted">Reviewer details and block list coming soon.</p>
    </div>
  )
}

export default Reviewer
