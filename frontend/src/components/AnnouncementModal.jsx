import { useEffect, useState } from 'react'
import { Megaphone, Sparkles } from 'lucide-react'

import characterWaving from '../assets/character-waving.png'

const STORAGE_KEY = 'review-well-announcement-v1'
// Short delay so a browser-mediated sign-in prompt gets the first moment
// instead of stacking with this modal.
const ANNOUNCEMENT_DELAY_MS = 3000

const CURRENT_FEATURES = [
  'Upload Reviewers as PDF or PPTX',
  'Browse public study guides',
  'Save guides and follow creators',
]

const COMING_SOON_FEATURES = [
  'AI Flashcards',
  'Pomodoro Technique',
  'Blurting',
]

// First-visit announcement. Renders nothing once dismissed — the flag lives
// in localStorage, so it shows once per browser.
const AnnouncementModal = () => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'dismissed'
    } catch {
      // Storage blocked (sandboxed preview, disabled cookies): fail visible
      // so first-time visitors still get the announcement.
      return false
    }
  })

  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (dismissed) return
    const timer = setTimeout(() => setReady(true), ANNOUNCEMENT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [dismissed])

  if (dismissed || !ready) return null

  const close = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'dismissed')
    } catch {
      // Private browsing without storage access — just hide for this visit.
    }
    setDismissed(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
        <div className="w-full max-w-md rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8">
          <img src={characterWaving} alt="Waving student illustration" className="mb-3 h-20 w-24 object-contain object-left" />
          <div className="flex items-center gap-2 text-accent" aria-hidden="true">
            <Megaphone className="h-5 w-5" />
          </div>
          <h2 id="announcement-title" className="mt-2 font-display text-2xl font-bold text-ink">
            Welcome to Review Well
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Here is what you can do right now:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm font-semibold text-ink">
            {CURRENT_FEATURES.map((feature) => (
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
export { STORAGE_KEY, ANNOUNCEMENT_DELAY_MS }
