import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, BookOpen, Clock3, LockKeyhole, Pencil, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LikeButton from '../components/social/LikeButton'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import { WorkspaceSkeleton } from '../components/common/Skeleton'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const ReadOnlyBlock = ({ block }) => {
  const content = block.contentData || {}

  if (block.blockType === 'topic_banner') {
    return <div className="rounded-soft bg-blush/60 px-4 py-3"><h2 className="font-display text-2xl font-bold text-ink">{content.heading}</h2></div>
  }

  if (block.blockType === 'sub_topic_banner') {
    return <div className="border-l-4 border-powder py-1 pl-4"><h3 className="font-display text-xl font-bold text-ink">{content.heading}</h3></div>
  }

  if (block.blockType === 'table') {
    return <div className="overflow-x-auto"><table className="w-full border-collapse border-2 border-stone text-left text-sm"><thead><tr>{(content.headers || []).map((header) => <th key={header} className="border border-stone bg-butter/60 p-3 font-extrabold text-ink">{header}</th>)}</tr></thead><tbody>{(content.rows || []).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="border border-stone p-3 text-muted">{cell}</td>)}</tr>)}</tbody></table></div>
  }

  return <article className="rounded-soft border-2 border-stone bg-paper p-4"><h3 className="font-display text-lg font-bold text-ink">{content.heading}</h3><p className="mt-2 whitespace-pre-wrap leading-relaxed text-muted">{content.body}</p></article>
}

const Reviewer = () => {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [reviewer, setReviewer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) return <WorkspaceSkeleton />

  if (error || !reviewer) {
    return <div className="mx-auto max-w-xl py-16"><ErrorAlert>{error || 'Reviewer not found'}</ErrorAlert><Link to="/" className="mt-5 inline-flex items-center gap-2 font-extrabold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back home</Link></div>
  }

  const isOwner = user?.id === reviewer.authorId

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to desk</Link>
        <div className="flex items-center gap-3">
          <LikeButton reviewerId={reviewer.id} initialLikeCount={reviewer._count?.likes || 0} />
          {isOwner && <Link to={`/workspace/${reviewer.id}`} className="inline-flex items-center gap-2 rounded-soft border-2 border-mint bg-mint px-4 py-2 text-sm font-extrabold text-ink hover:bg-butter"><Pencil className="h-4 w-4" /> Open workspace</Link>}
        </div>
      </div>

      <header className="rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-accent"><BookOpen className="h-4 w-4" /> Study guide</p><h1 className="mt-3 font-display text-4xl font-bold text-ink">{reviewer.title}</h1><p className="mt-3 text-muted">{reviewer.courseDescription}</p></div>
          <div className="flex items-center gap-2 rounded-full bg-powder px-3 py-2 text-xs font-extrabold text-ink"><LockKeyhole className="h-4 w-4" /> {reviewer.visibility}</div>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-stone pt-4 text-sm font-semibold text-muted"><span>{reviewer.courseCode}</span><span>{reviewer.semester}</span><span>{reviewer.examType}</span>{reviewer.user?.displayName && <span>By {reviewer.user.displayName}</span>}</div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <main className="min-h-[500px] rounded-soft border-2 border-stone bg-paper p-5 club-shadow sm:p-8" aria-label="Reviewer content">
          {reviewer.blocks?.length ? <div className="grid gap-5 md:grid-cols-2">{reviewer.blocks.map((block) => <ReadOnlyBlock key={block.id} block={block} />)}</div> : <div className="flex min-h-[300px] flex-col items-center justify-center text-center text-muted"><Sparkles className="mb-3 h-8 w-8 text-accent" /><p>This reviewer is ready for its first study block.</p></div>}
        </main>
        <aside className="h-fit rounded-soft border-2 border-stone bg-mint/40 p-5"><h2 className="font-display text-xl font-bold text-ink">Study details</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="font-extrabold text-muted">Assessment</dt><dd className="mt-1 text-ink">{reviewer.examType}</dd></div><div><dt className="font-extrabold text-muted">Semester</dt><dd className="mt-1 text-ink">{reviewer.semester}</dd></div><div><dt className="font-extrabold text-muted">Last updated</dt><dd className="mt-1 flex items-center gap-1 text-ink"><Clock3 className="h-4 w-4" /> {new Date(reviewer.updatedAt).toLocaleDateString()}</dd></div></dl></aside>
      </div>
    </div>
  )
}

export default Reviewer
