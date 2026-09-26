import { useEffect, useState } from 'react'
import axios from 'axios'
import { Megaphone, Sparkles } from 'lucide-react'

import characterWaving from '../assets/character-waving.png'
import { useAuth } from '../contexts/AuthContext'
import useAuthStore from '../stores/authStore'

// Bump this id for every new announcement. Everyone (signed-in users on any
// browser, guests per browser) sees each id exactly once: guests via
// localStorage, signed-in users via the server-synced dismissal.
const ANNOUNCEMENT_ID = 'v2-whats-new'
const STORAGE_KEY = `review-well-announcement-${ANNOUNCEMENT_ID}`

const NEW_FEATURES = [
  'Light, dark, and reading themes',
  'Search and filters on public reviewers',
  'Installable app with offline support',
  'Push notifications and live badges',
]

const COMING_SOON_FEATURES = [
  'AI Flashcards',
  'Pomodoro Technique',
  'Blurting',
]

// First-visit announcement per announcement id. Dismissal persists in this
// browser (guests and signed-in users) and, for signed-in users, on the
// server — so closing it here never resurfaces it on another browser.
const AnnouncementModal = () => {
  const { user, isAuthenticated } = useAuth()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dismissed'
    } catch {
      // Storage blocked — fail visible; the server check below still applies.
      return false
    }
  })

  // Server-synced dismissal: closing on one browser suppresses the same
  // announcement everywhere. Reads the dedicated endpoint (not the session
  // user object) so it works regardless of client field coverage.
  useEffect(() => {
    if (!isAuthenticated || !user) return
    let cancelled = false
    axios
      .get('/api/profile/me/announcement', { withCredentials: true })
      .then((response) => {
        if (!cancelled && response.data?.announcementSeenId === ANNOUNCEMENT_ID) {
          setDismissed(true)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user])

  const close = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'dismissed')
    } catch {
      // Private browsing without storage access — just hide for this visit.
    }
    if (isAuthenticated && user) {
      axios
        .put('/api/profile/me/announcement', { announcementId: ANNOUNCEMENT_ID }, { withCredentials: true })
        .then(() => {
          useAuthStore.getState().updateUser({ announcementSeenId: ANNOUNCEMENT_ID })
        })
        .catch(() => {})
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30" aria-hidden="true" onClick={close} />
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 pb-[env(safe-area-inset-bottom)] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
        <div className="w-full rounded-t-2xl border-2 border-b-0 border-stone bg-paper p-6 club-shadow club-rise sm:mx-auto sm:max-w-md sm:rounded-soft sm:border-b-2 sm:p-8">
          <img src={characterWaving} alt="Waving student illustration" className="mx-auto mb-3 h-24 w-28 object-contain object-center" />
          <div className="flex items-center gap-2 text-accent" aria-hidden="true">
            <Megaphone className="h-5 w-5" />
          </div>
          <h2 id="announcement-title" className="mt-2 font-display text-2xl font-bold text-ink">
            What’s New in Review Well
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Fresh in this update:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm font-semibold text-ink">
            {NEW_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="text-accent" aria-hidden="true">*</span> {feature}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 text-sm font-extrabold text-ink">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" /> Coming Soon
          </p>
          <ul className="mt-2 space-y-1.5 text-sm font-semibold text-ink">
            {COMING_SOON_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="text-accent" aria-hidden="true">~</span> {feature}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={close}
              className="rounded-soft border-2 border-accent bg-accent px-6 py-2.5 text-sm font-extrabold text-paper hover:-translate-y-0.5"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AnnouncementModal
export { STORAGE_KEY, ANNOUNCEMENT_ID }
