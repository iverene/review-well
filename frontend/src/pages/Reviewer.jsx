import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Copy,
  Download,
  Eye,
  Globe2,
  Link2,
  Loader2,
  LockKeyhole,
  Pencil,
  Printer,
  Share2,
  UsersRound,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import SaveButton from '../components/social/SaveButton'
import ReviewerPreview from '../components/reviewer/ReviewerPreview'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import { WorkspaceSkeleton } from '../components/common/Skeleton'
import { exportSheetsToPdf, reviewerPdfFilename } from '../utils/exportPdf'
import { paginateBlocks } from '../utils/paginate'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: LockKeyhole },
  { value: 'unlisted', label: 'Unlisted', icon: UsersRound },
  { value: 'public', label: 'Public', icon: Globe2 },
]

const Reviewer = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [reviewer, setReviewer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visSaving, setVisSaving] = useState(false)
  const [visError, setVisError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    const loadReviewer = async () => {
      try {
        const response = await axios.get(`/api/reviewers/${id}`, { withCredentials: true })
        const loadedReviewer = response.data.reviewer
        setReviewer(loadedReviewer)

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
    loadReviewer()
  }, [id, isAuthenticated, user])

  // Lock background scroll while the fullscreen preview is open
  useEffect(() => {
    if (!previewOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [previewOpen])

  // Track the most visible page for the fullscreen page indicator
  useEffect(() => {
    if (!previewOpen || typeof IntersectionObserver === 'undefined') return
    const root = scrollRef.current
    if (!root) return
    const seen = new Map()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = entry.target.dataset.index
        if (entry.isIntersecting) seen.set(idx, entry.intersectionRatio)
        else seen.delete(idx)
      })
      if (seen.size > 0) {
        const best = [...seen.entries()].sort((a, b) => b[1] - a[1])[0][0]
        setCurrentPage(Number(best))
      }
    }, { root, threshold: [0, 0.25, 0.5, 0.75, 1] })
    root.querySelectorAll('[data-preview-page]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [previewOpen])

  if (loading) return <WorkspaceSkeleton />

  if (error || !reviewer) {
    return <div className="mx-auto max-w-xl py-16"><ErrorAlert>{error || 'Reviewer not found'}</ErrorAlert><Link to="/" className="mt-5 inline-flex items-center gap-2 font-extrabold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back home</Link></div>
  }

  const isOwner = !!user?.id && user.id === reviewer.authorId
  const contentBlocks = (reviewer.blocks || []).filter((b) => b.blockType !== 'page_break')
  const hasContent = contentBlocks.length > 0
  const totalPages = Math.max(1, paginateBlocks(contentBlocks, 'A4').pages.length)
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

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    setError(null)
    // The inline preview shows the first page only; reveal all pages so the
    // download always compiles the complete document.
    const root = document.getElementById('reviewer-preview-root')
    root?.classList.add('export-all')
    try {
      await exportSheetsToPdf({
        rootId: 'reviewer-preview-root',
        pageSelector: '.preview-page',
        filename: reviewerPdfFilename(reviewer),
        format: 'a4',
      })
    } catch (downloadError) {
      console.error('Failed to download PDF:', downloadError)
      setError(getApiErrorMessage(downloadError, 'Unable to download the PDF.'))
    } finally {
      root?.classList.remove('export-all')
      setDownloading(false)
    }
  }

  const handlePrint = () => window.print()

  const previewNode = (
    <div id="reviewer-preview-root" className={previewOpen ? undefined : 'preview-first-only'}>
      <ReviewerPreview reviewer={reviewer} />
    </div>
  )

  return (
    <div className="w-full pb-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to desk</Link>
        <div className="flex flex-wrap items-center gap-2">
          <SaveButton reviewerId={reviewer.id} initialSaveCount={reviewer._count?.saves || 0} />
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
          <button
            type="button"
            onClick={() => { setCurrentPage(0); setPreviewOpen(true) }}
            disabled={!hasContent}
            title={hasContent ? 'Open fullscreen preview' : 'Add content before previewing'}
            className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-4 w-4" aria-hidden="true" /> View
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !hasContent}
            title={hasContent ? 'Download as PDF' : 'Add content before downloading'}
            className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />} Download
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!hasContent}
            title={hasContent ? 'Print the preview' : 'Add content before printing'}
            className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" aria-hidden="true" /> Print
          </button>
          {isOwner && <Link to={`/workspace/${reviewer.id}`} className="inline-flex items-center gap-2 rounded-soft border-2 border-mint bg-mint px-4 py-2 text-sm font-extrabold text-ink hover:bg-butter"><Pencil className="h-4 w-4" /> Open workspace</Link>}
        </div>
      </div>

      <header className="rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-accent"><BookOpen className="h-4 w-4" /> Study guide</p><h1 className="mt-3 font-display text-4xl font-bold text-ink">{reviewer.title}</h1><p className="mt-3 text-muted">{reviewer.courseDescription}</p></div>
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
        <main className="min-w-0" aria-label="Reviewer preview section">
          <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted"><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Preview</p>
          {hasContent ? (
            <>
              {!previewOpen && previewNode}
              {previewOpen && (
                <div className="rounded-soft border-2 border-dashed border-stone p-8 text-center text-sm text-muted">
                  Preview is open in fullscreen view.
                </div>
              )}
            </>
          ) : (
            <div className="rounded-soft border-2 border-dashed border-stone p-8 text-center text-sm text-muted">
              <p className="font-extrabold text-ink">No content to preview yet</p>
              <p className="mt-1">Add blocks in the workspace to enable preview, view, download, and print.</p>
            </div>
          )}
        </main>
        <aside className="h-fit rounded-soft border-2 border-stone bg-mint/40 p-5"><h2 className="font-display text-xl font-bold text-ink">Study details</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="font-extrabold text-muted">Assessment</dt><dd className="mt-1 text-ink">{reviewer.examType}</dd></div><div><dt className="font-extrabold text-muted">Semester</dt><dd className="mt-1 text-ink">{reviewer.semester}</dd></div><div><dt className="font-extrabold text-muted">Last updated</dt><dd className="mt-1 flex items-center gap-1 text-ink"><Clock3 className="h-4 w-4" /> {new Date(reviewer.updatedAt).toLocaleDateString()}</dd></div></dl></aside>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/50" onClick={() => setPreviewOpen(false)} role="dialog" aria-modal="true" aria-label="Fullscreen reviewer preview">
          <div className="no-print flex shrink-0 items-center justify-center gap-3 px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-extrabold text-ink shadow" aria-live="polite" data-testid="page-indicator">
              Page {`${currentPage + 1} / ${totalPages}`}
            </span>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-extrabold text-ink shadow hover:bg-stone"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Close preview
            </button>
          </div>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 sm:px-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto max-w-3xl space-y-6">
              {previewNode}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviewer
