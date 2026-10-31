import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, BookOpen, Bookmark, Clock3, LibraryBig, Plus, Sparkles } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import useCachedGet from '../hooks/useCachedGet'
import { cacheKey } from '../stores/queryCache'
import { getApiErrorMessage } from '../utils/apiError'
import { isSameCourse } from '../utils/courseMatching'
import { ReviewerGridSkeleton, Skeleton } from '../components/common/Skeleton'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import EmptyState from '../components/common/EmptyState'
import Tag from '../components/common/Tag'
import characterWaving from '../assets/character-waving.webp'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const ReviewerCard = ({ reviewer, compact = false, saves = 'full' }) => (
  <Card to={`/reviewer/${reviewer.id}`} className={`group flex flex-col ${compact ? 'min-w-[250px] max-w-[280px] shrink-0' : ''}`}>
    <div className="flex items-start justify-between gap-3">
      {reviewer.courseCode ? <Tag mono>{reviewer.courseCode}</Tag> : <span />}
      <BookOpen className="h-5 w-5 shrink-0 text-accent transition-transform duration-150 group-hover:-rotate-6" strokeWidth={2.2} aria-hidden="true" />
    </div>
    <p className="mt-3 line-clamp-2 break-words font-display text-lg font-bold leading-snug text-ink">{reviewer.title}</p>
    {saves !== 'none' && (
      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs font-semibold text-muted">
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
  </Card>
)

const Section = ({ icon: Icon, title, to, children, empty }) => (
  <section aria-label={title}>
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink md:text-2xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blush"><Icon className="h-4 w-4 text-accent" strokeWidth={2.4} aria-hidden="true" /></span>
        {title}
      </h2>
      {to && <Link to={to} className="flex shrink-0 items-center gap-1 rounded-soft px-2 py-1 text-sm font-extrabold text-muted hover:bg-cream hover:text-ink">View all <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </div>
    {children || empty}
  </section>
)

const FEATURES = [
  { mark: '*', title: 'Upload your slides', body: 'Drop in a PDF or PPTX and keep every reviewer in one personal library.', tone: 'bg-blush/60' },
  { mark: '+', title: 'Discover Study Guides', body: 'Browse public reviewers made by fellow students and start with the topics you need most.', tone: 'bg-mint/70' },
  { mark: '~', title: 'Save What Matters', body: 'Bookmark the guides you love and follow creators to see their new reviewers.', tone: 'bg-butter/70' },
]

const Landing = () => (
  <div className="space-y-6 pb-8 md:space-y-8">
    <section className="club-surface relative overflow-hidden px-5 py-8 md:px-10 md:py-14">
      <div className="relative max-w-xl club-rise md:max-w-2xl">
        <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-accent">Upload your slides. Study them well.</p>
        <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-6xl">Turn lecture slides into study sessions.</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg">Upload a PDF or PPTX, browse public study guides, and keep everything in one cozy study club.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button to="/login" variant="primary" size="lg">Join the study club</Button>
          <Button to="/reviewer/public" size="lg">Try public reviewers</Button>
        </div>
      </div>
      <img src="/logo.webp" alt="A student studying with a laptop" width="192" height="192" className="pointer-events-none absolute -bottom-8 -right-6 hidden h-64 w-64 object-contain md:block lg:h-72 lg:w-72" />
    </section>
    <section className="grid gap-4 md:grid-cols-3" aria-label="Study club features">
      {FEATURES.map(({ mark, title, body, tone }) => (
        <article key={title} className={`rounded-club border-2 border-stone p-5 shadow-sticker md:p-6 ${tone}`}>
          <div className="mb-3 font-display text-2xl text-accent" aria-hidden="true">{mark}</div>
          <h2 className="text-xl font-bold text-ink md:text-2xl">{title}</h2>
          <p className="mt-2 leading-relaxed text-ink/80">{body}</p>
        </article>
      ))}
    </section>
  </div>
)

const Home = () => {
  const { user, isAuthenticated, isGuest, loading: authLoading } = useAuth()
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

  // While the session resolves, identity is unknown: hold a loading screen
  // instead of flashing the landing page at returning users. Known guests
  // skip the gate and land immediately.
  if (authLoading && !isGuest) {
    return (
      <div className="mx-auto min-h-screen max-w-md space-y-5 px-4 py-20" role="status" aria-label="Loading your study desk"><img src="/logo.webp" alt="" className="mx-auto h-16 w-16 object-contain" /><Skeleton className="h-10 w-3/4 mx-auto" /><Skeleton className="h-40 w-full" /></div>
    )
  }

  if (!isAuthenticated) {
    if (!isGuest) return <Landing />
    return (
      <section className="space-y-6 pb-8">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Guest library</p>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl md:text-4xl">Public Reviewers</h1>
          <p className="mt-2 text-muted">Browse study guides shared by the Review Well community.</p>
        </div>
        {loading ? <ReviewerGridSkeleton /> : publicReviewers.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{publicReviewers.map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} />)}</div>
        ) : (
          <EmptyState title="No public reviewers yet">Check back soon — classmates are uploading new guides all the time.</EmptyState>
        )}
      </section>
    )
  }

  const sameCourse = publicReviewers.filter((reviewer) => isSameCourse(reviewer, user))
  const firstName = user?.displayName?.split(' ')[0]

  return (
    <div className="space-y-10 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <img src={characterWaving} alt="" aria-hidden="true" width="273" height="229" className="hidden h-24 w-28 shrink-0 object-contain sm:block" />
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Good to see you{firstName ? `, ${firstName}` : ''}</p>
            <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl md:text-4xl">Your Study Desk</h1>
            <p className="mt-1 text-muted">Pick up where you left off or find your next review.</p>
          </div>
        </div>
        <Button to="/create" variant="primary"><Plus className="h-4 w-4" aria-hidden="true" /> New Reviewer</Button>
      </div>
      {loading ? (
        <div className="space-y-10">
          {['w-64', 'w-72', 'w-48'].map((width) => (
            <div key={width} className="space-y-4"><Skeleton className={`h-8 ${width}`} /><ReviewerGridSkeleton count={3} /></div>
          ))}
        </div>
      ) : (
        <>
          <Section
            icon={Clock3}
            title="Recently Viewed Reviewers"
            empty={<EmptyState compact title="Nothing here yet">Reviewers you open will show up here.</EmptyState>}
          >
            {recentReviewers.length > 0 && (
              <div className="-mx-1 flex gap-4 overflow-x-auto show-scroll px-1 pb-3 pt-1">
                {recentReviewers.slice(0, 5).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} compact saves="icon" />)}
              </div>
            )}
          </Section>
          <Section
            icon={LibraryBig}
            title="Reviewers From the Same Course"
            to="/reviewer/public?course=mine"
            empty={(
              <EmptyState compact title="No matches yet" action={<Button to="/reviewer/public" size="sm">Browse public reviewers</Button>}>
                No reviewers match your program yet.
              </EmptyState>
            )}
          >
            {sameCourse.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sameCourse.slice(0, 3).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} saves="icon" />)}</div>}
          </Section>
          <Section
            icon={Sparkles}
            title="My Reviewers"
            to="/reviewer/my"
            empty={(
              <EmptyState title="Your shelf is empty" action={<Button to="/create" variant="primary" size="sm"><Plus className="h-4 w-4" aria-hidden="true" /> Upload your first reviewer</Button>}>
                Create your first reviewer to see it here.
              </EmptyState>
            )}
          >
            {myReviewers.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{myReviewers.slice(0, 3).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} saves="none" />)}</div>}
          </Section>
        </>
      )}
    </div>
  )
}

export default Home
