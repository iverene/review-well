import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft,
  BookOpenText,
  Check,
  Clock3,
  Copy,
  Download,
  EllipsisVertical,
  Globe2,
  Link2,
  LockKeyhole,
  Share2,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import SaveButton from '../components/social/SaveButton'
import StudyTabs from '../components/StudyTabs'
import ErrorAlert from '../components/common/ErrorAlert'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { formatExamType } from '../utils/examType'
import { purgeRecentReviewer } from '../utils/recentReviewers'
import { ReviewerSkeleton } from '../components/common/Skeleton'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const StudyDetailsList = ({ reviewer }) => (
  <dl className="space-y-4 text-sm">
    {reviewer.user?.displayName && <div><dt className="font-extrabold text-muted">Creator</dt><dd className="mt-1 text-ink">{reviewer.user.displayName}</dd></div>}
    <div><dt className="font-extrabold text-muted">Assessment</dt><dd className="mt-1 text-ink">{formatExamType(reviewer.examType)}</dd></div>
    <div><dt className="font-extrabold text-muted">Semester</dt><dd className="mt-1 text-ink">{reviewer.semester}</dd></div>
    <div><dt className="font-extrabold text-muted">Uploaded</dt><dd className="mt-1 flex items-center gap-1 text-ink"><Clock3 className="h-4 w-4" /> {reviewer.createdAt ? new Date(reviewer.createdAt).toLocaleDateString() : '—'}</dd></div>
  </dl>
)

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
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

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
    try {
      // Sharing publishes the reviewer so it can actually appear publicly
      const payload = visibility === 'private' ? { visibility } : { visibility, isDraft: false }
      const response = await axios.put(`/api/reviewers/${id}`, payload, { withCredentials: true })
      setReviewer(response.data?.reviewer || { ...reviewer, ...payload })
    } catch (saveError) {
      console.error('Failed to update visibility:', saveError)
      setError(getApiErrorMessage(saveError, 'Unable to update visibility.'))
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
      purgeRecentReviewer(id)
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
      <header className="py-2">
        <div className="min-w-0"><h1 className="font-display text-3xl font-bold text-ink md:text-4xl">{reviewer.title}</h1><p className="mt-3 text-muted">{reviewer.courseDescription}</p></div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <SaveButton reviewerId={reviewer.id} initialSaveCount={reviewer._count?.saves || 0} />
          {reviewer.fileUrl && (
            <a
              href={`/api/reviewer-files/${reviewer.id}/download`}
              aria-label="Download this reviewer file"
              title="Download this reviewer file"
              className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Download</span>
            </a>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={deleting}
              className="hidden items-center gap-2 rounded-soft border-2 border-blush bg-blush/40 px-4 py-2 text-sm font-extrabold text-accent hover:bg-blush disabled:opacity-60 sm:inline-flex"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => { setShareOpen((v) => !v); setCopied(false) }}
              aria-haspopup="dialog"
              aria-expanded={shareOpen}
              className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" /> Share
            </button>
          </div>
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label="More actions"
              className="inline-flex items-center rounded-soft border-2 border-stone bg-paper px-3 py-2 text-ink hover:bg-powder"
            >
              <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border-2 border-stone bg-paper p-2 shadow-xl" role="menu" aria-label="More actions">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMoreOpen(false); setDetailsOpen(true) }}
                    className="flex w-full items-center gap-2 rounded-soft px-3 py-2 text-sm font-extrabold text-ink hover:bg-powder"
                  >
                    <BookOpenText className="h-4 w-4" aria-hidden="true" /> View Details
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setMoreOpen(false); setConfirmingDelete(true) }}
                      className="flex w-full items-center gap-2 rounded-soft px-3 py-2 text-sm font-extrabold text-accent hover:bg-blush/40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMoreOpen(false); setShareOpen(true); setCopied(false) }}
                    className="flex w-full items-center gap-2 rounded-soft px-3 py-2 text-sm font-extrabold text-ink hover:bg-powder"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" /> Share
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {shareOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/30" onClick={() => setShareOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShareOpen(false)}>
            <div className="w-full max-w-sm rounded-soft border-2 border-stone bg-paper p-4 shadow-xl" role="dialog" aria-modal="true" aria-label="Share This Reviewer" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-extrabold text-ink">Share This Reviewer</p>
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
        {isOwner && (
          <div className="mt-3 border-t-2 border-stone pt-3">
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Visibility</p>
            <div className="mt-2 flex flex-col items-stretch gap-1 rounded-soft border-2 border-stone bg-paper p-1" role="radiogroup" aria-label="Visibility">
              {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={reviewer.visibility === value}
                  onClick={() => handleVisibilityChange(value)}
                  disabled={visSaving}
                  title={label}
                  className={`flex w-full items-center gap-1.5 rounded-soft px-3 py-1.5 text-xs font-extrabold transition-colors disabled:opacity-60 ${reviewer.visibility === value ? 'bg-ink text-paper' : 'text-muted hover:bg-stone/60 hover:text-ink'}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <ul className="mt-3 space-y-1.5 text-xs text-muted">
          <li className="flex items-start gap-2"><Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Public</b> — anyone can view it, including the public library.</span></li>
          <li className="flex items-start gap-2"><Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Unlisted</b> — only people with the shared link can view it.</span></li>
          <li className="flex items-start gap-2"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Private</b> — only you can view it.</span></li>
        </ul>
            </div>
          </div>
        </>
      )}

      {confirmingDelete && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/30" onClick={() => setConfirmingDelete(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmingDelete(false)}>
            <div className="w-full max-w-sm rounded-soft border-2 border-stone bg-paper p-5 club-shadow" role="alertdialog" aria-modal="true" aria-labelledby="delete-reviewer-title" aria-describedby="delete-reviewer-copy" onClick={(e) => e.stopPropagation()}>
              <h2 id="delete-reviewer-title" className="font-display text-xl font-bold text-ink">Delete This Reviewer?</h2>
              <p id="delete-reviewer-copy" className="mt-2 text-sm leading-relaxed text-muted">Its file, flashcards, blurting history, and focus sessions will be removed and can’t be recovered.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder"
                >
                  Keep It
                </button>
                <button
                  type="button"
                  onClick={handleDeleteReviewer}
                  className="rounded-soft border-2 border-accent bg-accent px-4 py-2 text-sm font-extrabold text-paper hover:opacity-90"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
        <aside className="hidden h-fit rounded-soft border-2 border-stone bg-mint/40 p-5 lg:block"><h2 className="font-display text-xl font-bold text-ink">Study Details</h2><div className="mt-4"><StudyDetailsList reviewer={reviewer} /></div></aside>
      </div>

      {detailsOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/30" onClick={() => setDetailsOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailsOpen(false)}>
            <div className="w-full max-w-sm rounded-soft border-2 border-stone bg-mint p-5 club-shadow" role="dialog" aria-modal="true" aria-label="Study details" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-ink">Study Details</h2>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Close study details"
                  className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4"><StudyDetailsList reviewer={reviewer} /></div>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  )
}

export default Reviewer
