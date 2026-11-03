import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { Palette, Sparkles, Zap } from 'lucide-react'

import characterWaving from '../assets/character-waving.webp'
import { useAuth } from '../contexts/AuthContext'
import useAuthStore from '../stores/authStore'

import Button from './common/Button'
import Modal from './common/Modal'

// Bump this id for every new announcement. Everyone (signed-in users on any
// browser, guests per browser) sees each id exactly once: guests via
// localStorage, signed-in users via the server-synced dismissal.
const ANNOUNCEMENT_ID = 'v3-soft-pop'
const STORAGE_KEY = `review-well-announcement-${ANNOUNCEMENT_ID}`

const NEW_LOOK = [
  'A fresh Soft Pop design with friendlier fonts',
  'A floating navigation dock that is always within reach',
  'Search any reviewer right from the top bar',
  'Clearer colors that are easier to read',
]

const FASTER = [
  'Reviewer pages open much faster',
  'Documents no longer reload while you are reading',
  'Lighter images and less background data use',
  'Sign in and land right back where you were',
]

const COMING_SOON_FEATURES = [
  'AI Flashcards',
  'Pomodoro Technique',
  'Blurting',
]

// First-visit announcement per announcement id. Dismissal persists in this
// browser (guests and signed-in users) and, for signed-in users, on the
// server — so closing it here never resurfaces it on another browser.
// Sign-in and onboarding are focused flows; the announcement waits until
// the user reaches the app proper.
const QUIET_PATHS = ['/login', '/auth/callback', '/onboarding']

const AnnouncementModal = () => {
  const { user, isAuthenticated } = useAuth()
  const { pathname } = useLocation()
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
  // user object) so it works regardless of client field coverage. A remote
  // dismissal is mirrored to this browser's storage so later refreshes stay
  // hidden from the first paint instead of flashing and hiding again.
  useEffect(() => {
    if (!isAuthenticated || !user) return
    let cancelled = false
    axios
      .get('/api/profile/me/announcement', { withCredentials: true })
      .then((response) => {
        if (!cancelled && response.data?.announcementSeenId === ANNOUNCEMENT_ID) {
          try {
            window.localStorage.setItem(STORAGE_KEY, 'dismissed')
          } catch {
            // Storage blocked — hide for this visit; the server stays the source of truth.
          }
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

  if (dismissed || QUIET_PATHS.includes(pathname)) return null

  return (
    <Modal open onClose={close} title="What’s New in Review Well" size="md">
      <img src={characterWaving} alt="" aria-hidden="true" width="273" height="229" className="mx-auto -mt-2 mb-2 h-24 w-28 object-contain" />
      <p className="text-center text-sm text-muted">Review Well just got a makeover and a speed boost.</p>
      <p className="mt-5 flex items-center gap-2 text-sm font-bold text-ink">
        <Palette className="h-4 w-4 text-accent" aria-hidden="true" /> A brand-new look
      </p>
      <ul className="mt-2 space-y-1.5 text-sm font-semibold text-ink">
        {NEW_LOOK.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-accent" aria-hidden="true">*</span> {feature}
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-center gap-2 text-sm font-bold text-ink">
        <Zap className="h-4 w-4 text-accent" aria-hidden="true" /> Faster and smoother
      </p>
      <ul className="mt-2 space-y-1.5 text-sm font-semibold text-ink">
        {FASTER.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-accent" aria-hidden="true">+</span> {feature}
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-center gap-2 text-sm font-bold text-ink">
        <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" /> Coming Soon
      </p>
      <ul className="mt-2 space-y-1.5 text-sm font-semibold text-muted">
        {COMING_SOON_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-accent" aria-hidden="true">~</span> {feature}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={close}>Got It</Button>
      </div>
    </Modal>
  )
}

export default AnnouncementModal
export { STORAGE_KEY, ANNOUNCEMENT_ID }
