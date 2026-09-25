import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Globe2,
  Link2,
  LockKeyhole,
  Share2,
  Trash2,
  UsersRound,
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import SaveButton from '../components/social/SaveButton'
import StudyTabs from '../components/StudyTabs'
import ErrorAlert from '../components/common/ErrorAlert'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { ReviewerSkeleton } from '../components/common/Skeleton'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: LockKeyhole },
  { value: 'unlisted', label: 'Unlisted', icon: UsersRound },
  { value: 'public', label: 'Public', icon: Globe2 },
]

const Reviewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [reviewer, setReviewer] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visSaving, setVisSaving] = useState(false)
  const [visError, setVisError] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const guest = !isAuthenticated
  const loginReturnTo = `/reviewer/${id}`
  const loginHref = `/login?returnTo=${encodeURIComponent(loginReturnTo)}`
  const sendGuestToLogin = () => navigate(loginHref)

  const loadReviewer = async () => {
    try {
      const response = await axios.get(`/api/reviewers/${id}`, { withCredentials: true })
      const loadedReviewer = response.data.reviewer
      setReviewer(loadedReviewer)
      setCards(Array.isArray(loadedReviewer.cards) ? loadedReviewer.cards : [])

      if (isAuthenticated && user?.id) {
        const key = recentReviewersKey(user.id)
        const recent = JSON.parse(window.localStorage.getItem(key) || '[]')
        const withoutCurrent = recent.filter((item) => item.id !== loadedReviewer.id)
        window.localStorage.setItem(key, JSON.stringify([loadedReviewer, ...withoutCurrent].slice(0, 5)))
      }
    } catch (loadError) {
      console.error('Failed to load reviewer:', loadError)
      setError(getApiErrorMessage(loadError, 'Unable to load this reviewer.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviewer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated, user])

  if (loading) return <ReviewerSkeleton />

  if (error || !reviewer) {
    return <div className="mx-auto max-w-xl py-16"><ErrorAlert>{error || 'Reviewer not found'}</ErrorAlert><Link to="/" className="mt-5 inline-flex items-center gap-2 font-extrabold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back home</Link></div>
  }

  const isOwner = !!user?.id && user.id === reviewer.authorId
  const shareUrl = `${window.location.origin}/reviewer/${reviewer.id}`

  const handleVisibilityChange = async (visibility) => {
    if (visibility === reviewer.visibility || visSaving) return
    setVisSaving(true)
    setVisError(null)
    try {
      // Sharing publishes the reviewer so it can actually appear publicly
      const payload = visibility === 'private' ? { visibility } : { visibility, isDraft: false }
      const response = await axios.put(`/api/reviewers/${id}`, payload, { withCredentials: true })
      setReviewer(response.data?.reviewer || { ...reviewer, ...payload })
    } catch (saveError) {
      console.error('Failed to update visibility:', saveError)
      setVisError(getApiErrorMessage(saveError, 'Unable to update visibility.'))
    } finally {
      setVisSaving(false)
    }
  }

  const handleDeleteReviewer = async () => {
    if (deleting) return
    setConfirmingDelete(false)
    setDeleting(true)
    setError(null)
    try {
      await axios.delete(`/api/reviewers/${id}`, { withCredentials: true })
      navigate('/reviewer/my')
    } catch (deleteError) {
      console.error('Failed to delete reviewer:', deleteError)
      setError(getApiErrorMessage(deleteError, 'Unable to delete this reviewer.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        // clipboard unavailable — the visible link can still be copied manually
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Guest progress stays in React state only — zero writes.
  const handleToggleKnown = async (cardId, known) => {
    if (guest) {
      setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, known } : card)))
      return
    }
    try {
      const response = await axios.patch(`/api/cards/${cardId}`, { known }, { withCredentials: true })
      const updated = response.data?.card
      setCards((prev) => prev.map((card) => (card.id === cardId ? updated || { ...card, known } : card)))
    } catch (toggleError) {
      console.error('Failed to update card:', toggleError)
      setError(getApiErrorMessage(toggleError, 'Unable to update this card.'))
    }
  }

  const handleAddCard = async ({ front, back }) => {
    if (guest) {
      sendGuestToLogin()
      return
    }
    try {
      const response = await axios.post(`/api/reviewers/${id}/cards`, { front, back }, { withCredentials: true })
      if (response.data?.card) setCards((prev) => [...prev, response.data.card])
    } catch (addError) {
      console.error('Failed to add card:', addError)
      setError(getApiErrorMessage(addError, 'Unable to add this card.'))
    }
  }

  const handleEditCard = async (cardId, { front, back }) => {
    if (guest) {
      sendGuestToLogin()
      return
    }
    try {
      const response = await axios.patch(`/api/cards/${cardId}`, { front, back }, { withCredentials: true })
      const updated = response.data?.card
      setCards((prev) => prev.map((card) => (card.id === cardId ? updated || { ...card, front, back } : card)))
    } catch (editError) {
      console.error('Failed to edit card:', editError)
      setError(getApiErrorMessage(editError, 'Unable to edit this card.'))
    }
  }

  const handleDeleteCard = async (cardId) => {
    if (guest) {
      sendGuestToLogin()
      return
    }
    try {
      await axios.delete(`/api/cards/${cardId}`, { withCredentials: true })
      setCards((prev) => prev.filter((card) => card.id !== cardId))
    } catch (deleteError) {
      console.error('Failed to delete card:', deleteError)
      setError(getApiErrorMessage(deleteError, 'Unable to delete this card.'))
    }
  }

  const handleGenerateDeck = () => {
    if (guest) {
      sendGuestToLogin()
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.pptx,.ppt,.txt'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setError(null)
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('reviewerId', id)
        if (cards.length > 0) form.append('confirm', 'true')
        if (reviewer?.courseCode) form.append('courseCode', reviewer.courseCode)
        if (reviewer?.courseDescription) form.append('courseDescription', reviewer.courseDescription)
        await axios.post('/api/ai/extract', form, { withCredentials: true })
        setLoading(true)
        await loadReviewer()
      } catch (generateError) {
        console.error('Failed to generate deck:', generateError)
        setError(getApiErrorMessage(generateError, 'Unable to generate the starter deck.'))
      }
    }
    input.click()
  }

  const handleBlurtingSubmit = async (dumpText) => {
    const response = await axios.post(`/api/reviewers/${id}/blurting`, { dumpText }, { withCredentials: true })
    return response.data
  }

  const handleBlurtingRate = async (attemptId, rating) => {
    try {
      await axios.patch(`/api/blurting/${attemptId}`, { selfRating: rating }, { withCredentials: true })
    } catch (rateError) {
      console.error('Failed to save self-rating:', rateError)
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Reviewer" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to desk</Link>
        <div className="flex flex-wrap items-center gap-2">
          <SaveButton reviewerId={reviewer.id} initialSaveCount={reviewer._count?.saves || 0} />
          {isOwner && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-soft border-2 border-blush bg-blush/40 px-4 py-2 text-sm font-extrabold text-accent hover:bg-blush disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShareOpen((v) => !v); setCopied(false) }}
              aria-haspopup="dialog"
              aria-expanded={shareOpen}
              className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" /> Share
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border-2 border-stone bg-paper p-4 shadow-xl" role="dialog" aria-label="Share this reviewer">
                  <p className="text-sm font-extrabold text-ink">Share this reviewer</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      aria-label="Share link"
                      onFocus={(e) => e.target.select()}
                      className="min-w-0 flex-1 rounded-soft border-2 border-stone bg-paper px-3 py-2 text-xs text-muted focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-soft border-2 px-3 py-2 text-xs font-extrabold ${copied ? 'border-mint bg-mint text-ink' : 'border-ink bg-ink text-paper hover:opacity-90'}`}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-muted">
                    <li className="flex items-start gap-2"><Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Public</b> — anyone can view it, including the public library.</span></li>
                    <li className="flex items-start gap-2"><Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Unlisted</b> — only people with the shared link can view it.</span></li>
                    <li className="flex items-start gap-2"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Private</b> — only you can view it.</span></li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmingDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/30" onClick={() => setConfirmingDelete(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-reviewer-title" aria-describedby="delete-reviewer-copy">
            <div className="w-full max-w-sm rounded-soft border-2 border-stone bg-paper p-5 club-shadow">
              <h2 id="delete-reviewer-title" className="font-display text-xl font-bold text-ink">Delete this reviewer?</h2>
              <p id="delete-reviewer-copy" className="mt-2 text-sm leading-relaxed text-muted">Its file, flashcards, blurting history, and focus sessions will be removed and can’t be recovered.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={handleDeleteReviewer}
                  className="rounded-soft border-2 border-accent bg-accent px-4 py-2 text-sm font-extrabold text-paper hover:opacity-90"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <header className="rounded-soft border-2 border-stone bg-paper p-4 club-shadow sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><h1 className="mt-3 font-display text-3xl font-bold text-ink md:text-4xl">{reviewer.title}</h1><p className="mt-3 text-muted">{reviewer.courseDescription}</p></div>
          {isOwner ? (
            <div>
              <div className="flex items-center gap-1 rounded-full border-2 border-stone bg-paper p-1" role="radiogroup" aria-label="Visibility">
                {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={reviewer.visibility === value}
                    onClick={() => handleVisibilityChange(value)}
                    disabled={visSaving}
                    title={label}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors disabled:opacity-60 ${reviewer.visibility === value ? 'bg-ink text-paper' : 'text-muted hover:bg-stone/60 hover:text-ink'}`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-right text-xs font-semibold text-muted" aria-live="polite">
                {visSaving ? 'Saving…' : visError ? visError : 'Visibility saved'}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-powder px-3 py-2 text-xs font-extrabold text-ink"><LockKeyhole className="h-4 w-4" /> {reviewer.visibility}</div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-stone pt-4 text-sm font-semibold text-muted"><span>{reviewer.courseCode}</span><span>{reviewer.semester}</span><span>{reviewer.examType}</span>{reviewer.user?.displayName && <span>By {reviewer.user.displayName}</span>}</div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <main className="min-w-0" aria-label="Study hub section">
          <StudyTabs
            reviewer={reviewer}
            cards={cards}
            guest={guest}
            gradesLeft={reviewer.quota?.gradesLeft}
            decksLeft={reviewer.quota?.decksLeft}
            isOwner={isOwner}
            loginReturnTo={loginReturnTo}
            onToggleKnown={handleToggleKnown}
            onAdd={handleAddCard}
            onEdit={handleEditCard}
            onDelete={handleDeleteCard}
            onGenerate={handleGenerateDeck}
            onBlurtingSubmit={handleBlurtingSubmit}
            onBlurtingRate={handleBlurtingRate}
          />
        </main>
        <aside className="h-fit rounded-soft border-2 border-stone bg-mint/40 p-5"><h2 className="font-display text-xl font-bold text-ink">Study details</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="font-extrabold text-muted">Assessment</dt><dd className="mt-1 text-ink">{reviewer.examType}</dd></div><div><dt className="font-extrabold text-muted">Semester</dt><dd className="mt-1 text-ink">{reviewer.semester}</dd></div><div><dt className="font-extrabold text-muted">Last updated</dt><dd className="mt-1 flex items-center gap-1 text-ink"><Clock3 className="h-4 w-4" /> {new Date(reviewer.updatedAt).toLocaleDateString()}</dd></div></dl></aside>
      </div>
    </PageContainer>
  )
}

export default Reviewer
