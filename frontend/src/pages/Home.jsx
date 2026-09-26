import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, BookOpen, Bookmark, Clock3, LibraryBig, Plus } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import useCachedGet from '../hooks/useCachedGet'
import { cacheKey } from '../stores/queryCache'
import { getApiErrorMessage } from '../utils/apiError'
import { isSameCourse } from '../utils/courseMatching'
import { ReviewerGridSkeleton, Skeleton } from '../components/common/Skeleton'
import characterWaving from '../assets/character-waving.png'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const ReviewerCard = ({ reviewer, compact = false, saves = 'full' }) => (
  <Link to={`/reviewer/${reviewer.id}`} className={`group relative overflow-hidden rounded-soft border-2 border-stone bg-paper p-4 club-shadow transition-transform hover:-translate-y-1 ${compact ? 'min-w-[250px] md:min-w-0' : ''}`}>
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="line-clamp-2 break-words font-display text-lg font-bold text-ink">{reviewer.title}</p>
          <p className="mt-1 text-sm font-semibold text-muted">{reviewer.courseCode}</p>
        </div>
        <BookOpen className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.2} aria-hidden="true" />
      </div>
      {saves !== 'none' && (
        <div className="mt-5 flex items-center justify-between gap-2 text-xs text-muted">
          {saves === 'icon' ? (
            <span className="inline-flex items-center gap-1" aria-label={`${reviewer._count?.saves || 0} saves`}>
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />{reviewer._count?.saves || 0}
            </span>
          ) : (
            <span>{reviewer._count?.saves || 0} saves</span>
          )}
          {reviewer.user?.displayName && <span className="truncate">by {reviewer.user.displayName}</span>}
        </div>
      )}
    </div>
  </Link>
)

const Section = ({ icon: Icon, title, to, children, empty }) => (
  <section>
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink md:text-2xl"><Icon className="h-5 w-5 text-accent" strokeWidth={2.3} aria-hidden="true" />{title}</h2>
      {to && <Link to={to} className="flex shrink-0 items-center gap-1 text-sm font-extrabold text-muted hover:text-ink">View all <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </div>
    {children || <p className="rounded-soft border-2 border-dashed border-stone px-5 py-8 text-center text-sm text-muted">{empty}</p>}
  </section>
)

const Landing = () => (
  <div className="space-y-8 pb-8">
    <section className="club-surface relative overflow-hidden px-4 py-6 md:px-10 md:py-12">
      <div className="absolute right-6 top-5 text-2xl text-accent" aria-hidden="true">*</div>
      <div className="relative max-w-2xl club-rise">
        <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-accent">Upload your slides. Study them well.</p>
        <h2 className="max-w-xl text-2xl font-bold leading-tight text-ink sm:text-3xl md:text-6xl">Turn lecture slides into study sessions.</h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg">Upload a PDF or PPTX, browse public study guides, and keep everything in one cozy study club.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/login" className="club-shadow rounded-soft border-2 border-accent bg-accent px-5 py-3 font-extrabold text-paper transition-transform hover:-translate-y-1">Join the study club</Link>
          <Link to="/reviewer/public" className="rounded-soft border-2 border-stone bg-paper px-5 py-3 font-extrabold text-ink transition-colors hover:bg-butter">Try public reviewers</Link>
        </div>
      </div>
      <img src="/logo.png" alt="A student studying with a laptop" className="pointer-events-none absolute -bottom-10 -right-8 hidden h-64 w-64 object-contain opacity-95 md:block lg:h-72 lg:w-72" />
    </section>
    <section className="grid gap-4 md:grid-cols-3" aria-label="Study club features">
      <article className="club-surface bg-blush/50 p-5 md:p-6"><div className="mb-4 text-xl text-accent md:mb-5 md:text-2xl" aria-hidden="true">*</div><h3 className="text-xl font-bold text-ink md:text-2xl">Upload your slides</h3><p className="mt-2 leading-relaxed text-muted">Drop in a PDF or PPTX and keep every reviewer in one personal library.</p></article>
      <article className="club-surface bg-mint/60 p-5 md:p-6"><div className="mb-4 text-xl text-accent md:mb-5 md:text-2xl" aria-hidden="true">+</div><h3 className="text-xl font-bold text-ink md:text-2xl">Discover Study Guides</h3><p className="mt-2 leading-relaxed text-muted">Browse public reviewers made by fellow students and start with the topics you need most.</p></article>
      <article className="club-surface bg-butter/70 p-5 md:p-6"><div className="mb-4 text-xl text-accent md:mb-5 md:text-2xl" aria-hidden="true">~</div><h3 className="text-xl font-bold text-ink md:text-2xl">Save What Matters</h3><p className="mt-2 leading-relaxed text-muted">Bookmark the guides you love and follow creators to see their new reviewers.</p></article>
    </section>
  </div>
)

const Home = () => {
  const { user, isAuthenticated, isGuest } = useAuth()
  const toast = useToast()
  const [publicReviewers, setPublicReviewers] = useState([])
  const [myReviewers, setMyReviewers] = useState([])
  const [recentReviewers, setRecentReviewers] = useState([])
  const [loading, setLoading] = useState(false)

  const publicKey = cacheKey('GET', '/api/reviewers/public', { limit: 50 })
  const {
    data: publicData,
    loading: publicLoading,
    error: publicError,
  } = useCachedGet(publicKey, () => axios.get('/api/reviewers/public', { params: { limit: 50 } }), {
    enabled: isAuthenticated || isGuest,
  })

  const myKey = 'GET /api/reviewers/my'
  const { data: myData } = useCachedGet(myKey, () => axios.get('/api/reviewers/my', { withCredentials: true }), {
    enabled: !!isAuthenticated && !!user?.id,
  })

  const storedRail = (() => {
    if (!isAuthenticated || !user?.id) return []
    try {
      const parsed = JSON.parse(window.localStorage.getItem(recentReviewersKey(user.id)) || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()
  const railIds = [...new Set(storedRail.map((entry) => entry?.id).filter(Boolean))]
  const existsKey = railIds.length > 0 ? cacheKey('GET', '/api/reviewers/exists', { ids: railIds.join(',') }) : null
  const { data: existsData } = useCachedGet(
    existsKey,
    () =>
      axios.get('/api/reviewers/exists', {
        params: { ids: railIds.join(',') },
        withCredentials: true,
      }),
    { enabled: !!existsKey }
  )

  useEffect(() => {
    setPublicReviewers(publicData?.reviewers || [])
  }, [publicData])

  useEffect(() => {
    if (!isAuthenticated) return
    setMyReviewers(myData?.reviewers || [])
  }, [myData, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    if (storedRail.length === 0) {
      setRecentReviewers([])
      return
    }
    if (!existsData) return
    // Server-side validation: evict deleted (or now-private) entries so
    // ghosts never render — localStorage is per-browser and goes stale
    // across devices after deletes.
    const valid = new Set(existsData.ids || [])
    const pruned = storedRail.filter((entry) => valid.has(entry?.id))
    try {
      window.localStorage.setItem(recentReviewersKey(user.id), JSON.stringify(pruned))
    } catch {
      // Corrupt rail — keep the in-memory list and try again next visit.
    }
    setRecentReviewers(pruned)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existsData, isAuthenticated, user?.id])

  useEffect(() => {
    setLoading(publicLoading)
  }, [publicLoading])

  useEffect(() => {
    if (publicError && publicReviewers.length === 0) {
      toast.error(getApiErrorMessage(publicError, 'Unable to load reviewers right now.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicError])

  if (!isAuthenticated) {
    return <div className="space-y-8">{isGuest ? <section className="space-y-6 pb-8"><div><p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Guest library</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl md:text-4xl">Public Reviewers</h1><p className="mt-2 text-muted">Browse study guides shared by the Review Well community.</p></div>{loading ? <ReviewerGridSkeleton /> : publicReviewers.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{publicReviewers.map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} />)}</div> : <p className="text-muted">No public reviewers are available yet.</p>}</section> : <Landing />}</div>
  }

  const sameCourse = publicReviewers.filter((reviewer) => isSameCourse(reviewer, user))

  return <div className="space-y-10 pb-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><img src={characterWaving} alt="Waving student illustration" className="mb-3 h-20 w-24 object-contain object-left md:h-28 md:w-36" /><p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Good to see you, {user?.displayName?.split(' ')[0]}</p><h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl md:text-4xl">Your Study Desk</h1><p className="mt-2 text-muted">Pick up where you left off or find your next review.</p></div><Link to="/create" className="flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-4 py-3 text-sm font-extrabold text-paper hover:-translate-y-0.5"><Plus className="h-4 w-4" aria-hidden="true" /> New Reviewer</Link></div>{loading ? <div className="space-y-10"><div className="space-y-4"><Skeleton className="h-8 w-64" /><ReviewerGridSkeleton count={3} /></div><div className="space-y-4"><Skeleton className="h-8 w-72" /><ReviewerGridSkeleton count={3} /></div><div className="space-y-4"><Skeleton className="h-8 w-48" /><ReviewerGridSkeleton count={3} /></div></div> : <><Section icon={Clock3} title="Recently Viewed Reviewers" empty="Reviewers you open will show up here.">{recentReviewers.length > 0 && <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-3 pt-2">{recentReviewers.slice(0, 5).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} compact saves="icon" />)}</div>}</Section><Section icon={LibraryBig} title="Reviewers From the Same Course" to="/reviewer/public?course=mine" empty="No reviewers match your program yet.">{sameCourse.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sameCourse.slice(0, 3).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} saves="icon" />)}</div>}</Section><Section icon={BookOpen} title="My Reviewers" to="/reviewer/my" empty="Create your first reviewer to see it here.">{myReviewers.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{myReviewers.slice(0, 3).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} saves="none" />)}</div>}</Section></>}</div>
}

export default Home
