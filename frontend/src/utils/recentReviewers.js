// Recently-viewed reviewers live in per-user localStorage entries shaped
// [{ id, ...preview }]. Deleting a reviewer must evict it everywhere, so the
// purge sweeps every user's key by prefix (keys are per-user suffixed).

const RECENT_PREFIX = 'review-well-recent-reviewers:'

export const recentReviewersKey = (userId) => `${RECENT_PREFIX}${userId}`

export const purgeRecentReviewer = (reviewerId) => {
  try {
    const doomed = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(RECENT_PREFIX)) doomed.push(key)
    }
    doomed.forEach((key) => {
      try {
        const entries = JSON.parse(window.localStorage.getItem(key) || '[]')
        const kept = Array.isArray(entries) ? entries.filter((entry) => entry?.id !== reviewerId) : []
        if (kept.length === entries.length) return
        if (kept.length === 0) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, JSON.stringify(kept))
      } catch {
        window.localStorage.removeItem(key)
      }
    })
  } catch {
    // Storage blocked — nothing persisted, nothing to purge.
  }
}
