import { useEffect } from 'react'

const recentReviewersKey = 'review-well-recent-reviewers'

function Reviewer() {
  useEffect(() => {
    const saveRecentReviewer = async () => {
      try {
        const response = await fetch(`/api/reviewers/${window.location.pathname.split('/').pop()}`, { credentials: 'include' })
        if (!response.ok) return
        const { reviewer } = await response.json()
        const recent = JSON.parse(window.localStorage.getItem(recentReviewersKey) || '[]')
        const withoutCurrent = recent.filter((item) => item.id !== reviewer.id)
        window.localStorage.setItem(recentReviewersKey, JSON.stringify([reviewer, ...withoutCurrent].slice(0, 6)))
      } catch (error) {
        console.error('Failed to save recent reviewer:', error)
      }
    }

    saveRecentReviewer()
  }, [])

  return (
    <div>
      <h2 className="text-3xl font-semibold text-ink mb-4">Reviewer</h2>
      <p className="text-muted">Reviewer details and block list coming soon.</p>
    </div>
  )
}

export default Reviewer
