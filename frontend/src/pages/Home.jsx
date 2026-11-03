import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, Bookmark, Clock3, LibraryBig, Plus, Sparkles, UsersRound } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import useCachedGet from '../hooks/useCachedGet'
import { cacheKey } from '../stores/queryCache'
import { getApiErrorMessage } from '../utils/apiError'
import { isSameCourse } from '../utils/courseMatching'
import { ReviewerGridSkeleton, Skeleton } from '../components/common/Skeleton'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import ReviewerCard, { pastelFor } from '../components/reviewer/ReviewerCard'
import characterWaving from '../assets/character-waving.webp'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const Section = ({ icon: Icon, title, to, action, children, empty }) => (
  <section aria-label={title}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink md:text-2xl">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush"><Icon className="h-4 w-4 text-ink" strokeWidth={2.2} aria-hidden="true" /></span>
        {title}
      </h2>
      {action}
      {to && <Link to={to} className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold text-muted hover:bg-cream hover:text-ink">View all <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </div>
    {children || empty}
  </section>
)

// "From your course" rows: a pastel course dot, title, creator, saves.
const ReviewerRow = ({ reviewer }) => (
  <Link to={`/reviewer/${reviewer.id}`} className="flex items-center gap-3.5 rounded-club bg-cream px-4 py-3.5 transition-colors duration-150 hover:bg-blush/50">
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold text-ink ${pastelFor(reviewer.courseCode || reviewer.id)}`} aria-hidden="true">
      {(reviewer.courseCode || '•').split(' ')[0].slice(0, 3)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-bold text-ink">{reviewer.title}</span>
      <span className="truncate text-sm text-muted">{[reviewer.user?.displayName, reviewer.courseCode].filter(Boolean).join(' · ')}</span>
    </span>
    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-muted" aria-label={`${reviewer._count?.saves || 0} saves`}>
      <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />{reviewer._count?.saves || 0}
    </span>
  </Link>
)

const FEATURES = [
  { mark: '*', title: 'Upload your slides', body: 'Drop in a PDF or PPTX and keep every reviewer in one personal library.', tone: 'bg-blush' },
  { mark: '+', title: 'Discover Study Guides', body: 'Browse public reviewers made by fellow students and start with the topics you need most.', tone: 'bg-mint' },
  { mark: '~', title: 'Save What Matters', body: 'Bookmark the guides you love and follow creators to see their new reviewers.', tone: 'bg-powder' },
]

const Landing = () => (
  <div className="space-y-6 pb-8 md:space-y-8">
    <section className="relative overflow-hidden rounded-[32px] bg-blush px-6 py-9 md:px-12 md:py-16">
      <div className="relative max-w-xl club-rise md:max-w-2xl">
        <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-ink">Upload your slides. Study them well.</p>
        <h1 className="text-4xl font-bold leading-[1.05] text-ink sm:text-5xl md:text-6xl">Turn lecture slides into study sessions.</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/85 md:text-lg">Upload a PDF or PPTX, browse public study guides, and keep everything in one cozy study club.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button to="/login" variant="primary" size="lg">Join the study club</Button>
          <Button to="/reviewer/public" size="lg">Try public reviewers</Button>
        </div>
      </div>
      <img src={characterWaving} alt="A waving student with a stack of books" width="273" height="229" className="pointer-events-none absolute bottom-6 right-8 hidden h-56 w-64 object-contain md:block lg:h-64 lg:w-72" />
    </section>
    <section className="grid gap-4 md:grid-cols-3" aria-label="Study club features">
      {FEATURES.map(({ mark, title, body, tone }) => (
        <article key={title} className={`rounded-club p-6 md:p-7 ${tone}`}>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-paper font-display text-xl text-accent" aria-hidden="true">{mark}</div>
          <h2 className="text-xl font-bold text-ink md:text-2xl">{title}</h2>
          <p className="mt-2 leading-relaxed text-ink/85">{body}</p>
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
  const [courseFilter, setCourseFilter] = useState('all')

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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{publicReviewers.map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} />)}</div>
        ) : (
          <EmptyState title="No public reviewers yet">Check back soon — classmates are uploading new guides all the time.</EmptyState>
        )}
      </section>
    )
  }

  const sameCourse = publicReviewers.filter((reviewer) => isSameCourse(reviewer, user))
  const firstName = user?.displayName?.split(' ')[0]
  const recentCourses = [...new Set(recentReviewers.map((reviewer) => reviewer.courseCode).filter(Boolean))]
  const visibleRecent = recentReviewers
    .filter((reviewer) => courseFilter === 'all' || reviewer.courseCode === courseFilter)
    .slice(0, 4)
  const chips = [{ value: 'all', label: 'All' }, ...recentCourses.map((code) => ({ value: code, label: code }))]

  return (
    <div className="space-y-10 pb-8">
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] bg-blush px-6 py-7 sm:px-9 sm:py-8">
        <div className="flex items-center gap-4 sm:gap-5">
          <img src={characterWaving} alt="" aria-hidden="true" width="273" height="229" className="h-20 w-24 shrink-0 object-contain sm:h-28 sm:w-32" />
          <div>
            <p className="text-sm font-bold text-ink">Good to see you{firstName ? `, ${firstName}` : ''}!</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-ink md:text-4xl">Your Study Desk</h1>
            <p className="mt-1 text-ink/85">
              {recentReviewers.length > 0
                ? `${recentReviewers.length} ${recentReviewers.length === 1 ? 'reviewer is' : 'reviewers are'} waiting where you left them.`
                : 'Pick up where you left off or find your next review.'}
            </p>
          </div>
        </div>
        <Button to="/create" variant="primary" size="lg"><Plus className="h-4 w-4" aria-hidden="true" /> New Reviewer</Button>
      </section>

      {loading ? (
        <div className="space-y-10">
          {['w-64', 'w-72', 'w-48'].map((width) => (
            <div key={width} className="space-y-4"><Skeleton className={`h-8 ${width}`} /><ReviewerGridSkeleton count={4} /></div>
          ))}
        </div>
      ) : (
        <>
          <Section
            icon={Clock3}
            title="Recently Viewed Reviewers"
            action={chips.length > 2 && (
              <div role="group" aria-label="Filter by course" className="flex flex-wrap gap-2">
                {chips.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={courseFilter === value}
                    onClick={() => setCourseFilter(value)}
                    className={`min-h-9 rounded-full px-4 text-sm font-bold transition-colors duration-150 ${value === 'all' ? '' : 'font-mono'} ${courseFilter === value ? 'bg-ink text-paper' : 'bg-cream text-ink hover:bg-blush/60'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            empty={<EmptyState compact title="Nothing here yet">Reviewers you open will show up here.</EmptyState>}
          >
            {visibleRecent.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visibleRecent.map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} saves="icon" />)}
              </div>
            )}
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
            {myReviewers.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{myReviewers.slice(0, 3).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} saves="none" />)}</div>}
          </Section>

          <div className="flex flex-wrap gap-6">
            <div className="min-w-0 flex-[3_1_480px]">
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
                {sameCourse.length > 0 && <div className="space-y-2.5">{sameCourse.slice(0, 4).map((reviewer) => <ReviewerRow key={reviewer.id} reviewer={reviewer} />)}</div>}
              </Section>
            </div>
            <section aria-label="Study with friends" className="flex flex-[2_1_280px] flex-col gap-3 self-start rounded-club bg-powder p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper"><UsersRound className="h-5 w-5 text-ink" aria-hidden="true" /></span>
              <h2 className="font-display text-xl font-semibold text-ink">Study with friends</h2>
              <p className="text-ink/85">Follow classmates to see their new reviewers in your notifications first.</p>
              <Button to="/friends" className="self-start border-paper bg-paper hover:border-paper hover:bg-paper/80">Find friends</Button>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default Home
