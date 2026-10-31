import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  EllipsisVertical,
  Globe2,
  Link2,
  LockKeyhole,
  Pencil,
  Share2,
  Trash2,
  UsersRound,
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import SaveButton from '../components/social/SaveButton'
import StudyTabs, { preloadPdfViewer } from '../components/StudyTabs'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import Tag from '../components/common/Tag'
import PageContainer from '../components/common/PageContainer'
import useCachedGet from '../hooks/useCachedGet'
import useQueryCache from '../stores/queryCache'
import { getApiErrorMessage } from '../utils/apiError'
import { formatExamType } from '../utils/examType'
import { purgeRecentReviewer } from '../utils/recentReviewers'
import { useToast } from '../contexts/ToastContext'
import { ReviewerSkeleton } from '../components/common/Skeleton'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

// Recently Viewed cards need only these fields. Storing the whole detail
// payload would persist cards, prompts, quota, and short-lived signed file
// URLs in localStorage on every visit.
const recentPreview = (reviewer) => ({
  id: reviewer.id,
  title: reviewer.title,
  courseCode: reviewer.courseCode,
  courseDescription: reviewer.courseDescription,
  user: reviewer.user ? { displayName: reviewer.user.displayName } : undefined,
  _count: { saves: reviewer._count?.saves || 0 },
})

// Study details sit inline under the title on every screen size, so phones
// no longer need a separate dialog to see who made it and for which exam.
const StudyDetails = ({ reviewer }) => {
  const items = [
    reviewer.user?.displayName && ['Creator', reviewer.user.displayName],
    ['Assessment', formatExamType(reviewer.examType)],
    reviewer.semester && ['Semester', reviewer.semester],
    ['Uploaded', reviewer.createdAt ? new Date(reviewer.createdAt).toLocaleDateString() : '—'],
  ].filter(Boolean)
  return (
    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap" aria-label="Study details">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">{label}</dt>
          <dd className="mt-0.5 truncate text-sm font-bold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: LockKeyhole, tone: 'neutral' },
  { value: 'unlisted', label: 'Unlisted', icon: UsersRound, tone: 'powder' },
  { value: 'public', label: 'Public', icon: Globe2, tone: 'mint' },
]

const Reviewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const [error, setError] = useState(null)
  const [visSaving, setVisSaving] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const keepButtonRef = useRef(null)
  const copiedTimerRef = useRef(null)

  const guest = !isAuthenticated
  const loginReturnTo = `/reviewer/${id}`
  const loginHref = `/login?returnTo=${encodeURIComponent(loginReturnTo)}`
  const sendGuestToLogin = () => navigate(loginHref)

  const detailKey = `GET /api/reviewers/${id}`
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useCachedGet(detailKey, () => axios.get(`/api/reviewers/${id}`, { withCredentials: true }), {
    enabled: !!id,
  })

  // Seeded from the cache so a revisited reviewer renders immediately.
  const [reviewer, setReviewer] = useState(() => detailData?.reviewer || null)
  const [cards, setCards] = useState(() => (Array.isArray(detailData?.reviewer?.cards) ? detailData.reviewer.cards : []))

  useEffect(() => () => clearTimeout(copiedTimerRef.current), [])

  useEffect(() => {
    preloadPdfViewer()
  }, [])

  useEffect(() => {
    const loadedReviewer = detailData?.reviewer
    if (!loadedReviewer) return
    setReviewer(loadedReviewer)
    setCards(Array.isArray(loadedReviewer.cards) ? loadedReviewer.cards : [])
    if (isAuthenticated && user?.id) {
      // Storage must never fail the page: corrupt entries fall back to a
      // fresh rail instead of pushing the loaded reviewer into onError.
      try {
        const key = recentReviewersKey(user.id)
        const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
        const recent = Array.isArray(parsed) ? parsed : []
        const withoutCurrent = recent.filter((item) => item?.id !== loadedReviewer.id)
        window.localStorage.setItem(key, JSON.stringify([recentPreview(loadedReviewer), ...withoutCurrent].slice(0, 5)))
      } catch {
        // Corrupt rail — leave storage alone and keep the loaded reviewer.
      }
    }
  }, [detailData, isAuthenticated, user?.id])

  useEffect(() => {
    if (!detailError) {
      setError(null)
      return
    }
    // A ghost entry (deleted since it was listed or saved) heals itself:
    // evict it from Recently Viewed on every surface.
    if (detailError.response?.status === 404) purgeRecentReviewer(id)
    setError(getApiErrorMessage(detailError, 'Unable to load this reviewer.'))
  }, [detailError, id])

  if (!reviewer && !error && (detailLoading || detailData?.reviewer)) return <ReviewerSkeleton />

  if (error || !reviewer) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <EmptyState
          title="We couldn’t open this reviewer"
          action={(
            <>
              <Button to="/"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back home</Button>
              <Button to="/reviewer/public" variant="primary">Browse public reviewers</Button>
            </>
          )}
        >
          <p role="alert">{error || 'Reviewer not found'}</p>
        </EmptyState>
      </div>
    )
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
      // The update returns the bare row; keep the hub enrichment (fileUrl,
      // cards, quota, save count) the detail endpoint added.
      setReviewer((previous) => ({ ...previous, ...payload, ...(response.data?.reviewer || {}) }))
      useQueryCache.getState().invalidate('GET /api/reviewers')
      toast.success('Visibility Updated')
    } catch (saveError) {
      console.error('Failed to update visibility:', saveError)
      toast.error(getApiErrorMessage(saveError, 'Unable to update visibility.'))
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
      useQueryCache.getState().invalidate('GET /api/reviewers')
      toast.success('Reviewer Deleted')
      navigate('/reviewer/my')
    } catch (deleteError) {
      console.error('Failed to delete reviewer:', deleteError)
      toast.error(getApiErrorMessage(deleteError, 'Unable to delete this reviewer.'))
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
    clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
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
      useQueryCache.getState().invalidate(detailKey)
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
      useQueryCache.getState().invalidate(detailKey)
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
      useQueryCache.getState().invalidate(detailKey)
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
      useQueryCache.getState().invalidate(detailKey)
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
        await refreshDetail()
      } catch (generateError) {
        console.error('Failed to generate deck:', generateError)
        setError(getApiErrorMessage(generateError, 'Unable to generate the starter deck.'))
      }
    }
    input.click()
  }

  const handleBlurtingSubmit = async (dumpText) => {
    if (guest) {
      sendGuestToLogin()
      return { gradedVia: 'self', sourceExcerpt: '', keyPoints: [] }
    }
    const response = await axios.post(`/api/reviewers/${id}/blurting`, { dumpText }, { withCredentials: true })
    useQueryCache.getState().invalidate(detailKey)
    return response.data
  }

  const handleBlurtingRate = async (attemptId, rating) => {
    try {
      await axios.patch(`/api/blurting/${attemptId}`, { selfRating: rating }, { withCredentials: true })
      useQueryCache.getState().invalidate(detailKey)
    } catch (rateError) {
      console.error('Failed to save self-rating:', rateError)
      toast.error(getApiErrorMessage(rateError, 'Unable to save your rating.'))
    }
  }

  const visibilityOption = VISIBILITY_OPTIONS.find(({ value }) => value === reviewer.visibility)
  const VisibilityIcon = visibilityOption?.icon

  return (
    <PageContainer>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          {reviewer.courseCode && <Tag mono>{reviewer.courseCode}</Tag>}
          {isOwner && visibilityOption && (
            <Tag tone={visibilityOption.tone}>
              <VisibilityIcon className="h-3 w-3" aria-hidden="true" /> {visibilityOption.label}
            </Tag>
          )}
        </div>
        <h1 className="mt-3 break-words font-display text-2xl font-bold leading-tight text-ink sm:text-3xl md:text-4xl">{reviewer.title}</h1>
        {reviewer.courseDescription && <p className="mt-2 text-muted">{reviewer.courseDescription}</p>}
        <StudyDetails reviewer={reviewer} />

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-stone pt-4">
          <SaveButton
            reviewerId={reviewer.id}
            initialSaved={typeof reviewer.isSaved === 'boolean' ? reviewer.isSaved : undefined}
            initialSaveCount={reviewer._count?.saves || 0}
          />
          {reviewer.fileUrl && (
            <Button
              href={`/api/reviewer-files/${reviewer.id}/download`}
              aria-label="Download this reviewer file"
              title="Download this reviewer file"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Download</span>
            </Button>
          )}
          <Button
            onClick={() => { setShareOpen(true); setCopied(false) }}
            aria-haspopup="dialog"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" /> Share
          </Button>
          {isOwner && (
            <div className="ml-auto flex items-center gap-2">
              <Button to={`/create?edit=${reviewer.id}`} variant="quiet" className="hidden sm:inline-flex">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmingDelete(true)}
                disabled={deleting}
                className="hidden sm:inline-flex"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> {deleting ? 'Deleting…' : 'Delete'}
              </Button>
              <div className="relative sm:hidden">
                <Button
                  size="icon"
                  onClick={() => setMoreOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  aria-label="More actions"
                >
                  <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
                </Button>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setMoreOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-44 rounded-club border-2 border-stone bg-paper p-1.5 shadow-sticker" role="menu" aria-label="More actions">
                      <Link
                        to={`/create?edit=${reviewer.id}`}
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-soft px-3 py-2.5 text-sm font-extrabold text-ink hover:bg-cream"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setMoreOpen(false); setConfirmingDelete(true) }}
                        className="flex w-full items-center gap-2 rounded-soft px-3 py-2.5 text-sm font-extrabold text-accent hover:bg-blush/50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share This Reviewer" closeLabel="Close share dialog">
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            aria-label="Share link"
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 rounded-soft border-2 border-line bg-cream px-3 py-2 text-xs text-ink focus:border-accent focus:outline-none"
          />
          <Button
            size="sm"
            variant={copied ? 'secondary' : 'primary'}
            onClick={handleCopyLink}
            className={copied ? 'border-mint bg-mint' : ''}
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        {isOwner && (reviewer.visibility === 'private' || reviewer.isDraft) && (
          <p className="mt-3 flex items-start gap-2 rounded-soft border-2 border-butter bg-butter/40 px-3 py-2 text-xs font-bold text-ink">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Only you can open this link — switch to Unlisted below so recipients can view it.</span>
          </p>
        )}
        {isOwner && (
          <div className="mt-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Visibility</p>
            <div className="mt-2 grid grid-cols-3 gap-1 rounded-soft border-2 border-stone bg-cream p-1" role="radiogroup" aria-label="Visibility">
              {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={reviewer.visibility === value}
                  onClick={() => handleVisibilityChange(value)}
                  disabled={visSaving}
                  className={`flex items-center justify-center gap-1.5 rounded-soft px-2 py-2 text-xs font-extrabold transition-colors duration-150 disabled:opacity-60 ${reviewer.visibility === value ? 'bg-ink text-paper' : 'text-muted hover:bg-paper hover:text-ink'}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <ul className="mt-4 space-y-1.5 text-xs text-muted">
          <li className="flex items-start gap-2"><Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Public</b> — anyone can view it, including the public library.</span></li>
          <li className="flex items-start gap-2"><Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Unlisted</b> — only people with the shared link can view it.</span></li>
          <li className="flex items-start gap-2"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span><b className="text-ink">Private</b> — only you can view it.</span></li>
        </ul>
      </Modal>

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete This Reviewer?"
        role="alertdialog"
        describedBy="delete-reviewer-copy"
        initialFocusRef={keepButtonRef}
      >
        <p id="delete-reviewer-copy" className="mt-2 text-sm leading-relaxed text-muted">Its file, flashcards, blurting history, and focus sessions will be removed and can’t be recovered.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button ref={keepButtonRef} onClick={() => setConfirmingDelete(false)}>Keep It</Button>
          <Button variant="primary" onClick={handleDeleteReviewer}>Yes, Delete</Button>
        </div>
      </Modal>

      <section className="mt-6 min-w-0" aria-label="Study hub section">
        <StudyTabs
          reviewer={reviewer}
          cards={cards}
          guest={guest}
          gradesLeft={reviewer.quota?.gradesLeft}
          decksLeft={reviewer.quota?.decksLeft}
          isOwner={isOwner}
          onToggleKnown={handleToggleKnown}
          onAdd={handleAddCard}
          onEdit={handleEditCard}
          onDelete={handleDeleteCard}
          onGenerate={handleGenerateDeck}
          onBlurtingSubmit={handleBlurtingSubmit}
          onBlurtingRate={handleBlurtingRate}
        />
      </section>
    </PageContainer>
  )
}

// Remount per reviewer id so dialogs, cards, and loading state never carry
// over when navigating straight from one reviewer to another.
const ReviewerRoute = () => {
  const { id } = useParams()
  return <Reviewer key={id} />
}

export default ReviewerRoute
