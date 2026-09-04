import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowRight, BookOpen, Clock3, LibraryBig, Plus } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import { isSameCourse } from '../utils/courseMatching'
import { ReviewerGridSkeleton, Skeleton } from '../components/common/Skeleton'
import characterWaving from '../assets/character-waving.png'

const recentReviewersKey = (userId) => `review-well-recent-reviewers:${userId}`

const ReviewerCard = ({ reviewer, compact = false }) => (
  <Link to={`/reviewer/${reviewer.id}`} className={`group relative overflow-hidden rounded-soft border-2 border-stone bg-paper p-4 club-shadow transition-transform hover:-translate-y-1 ${compact ? 'min-w-[250px] md:min-w-0' : ''}`}>
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="line-clamp-2 font-display text-lg font-bold text-ink">{reviewer.title}</p>
          <p className="mt-1 text-sm font-semibold text-muted">{reviewer.courseCode}</p>
        </div>
        <BookOpen className="h-5 w-5 shrink-0 text-accent" strokeWidth={2.2} aria-hidden="true" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-2 text-xs text-muted">
        <span>{reviewer._count?.saves || 0} saves</span>
        {reviewer.user?.displayName && <span className="truncate">by {reviewer.user.displayName}</span>}
      </div>
    </div>
  </Link>
)

const Section = ({ icon: Icon, title, to, children, empty }) => (
  <section>
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink"><Icon className="h-5 w-5 text-accent" strokeWidth={2.3} aria-hidden="true" />{title}</h2>
      {to && <Link to={to} className="flex shrink-0 items-center gap-1 text-sm font-extrabold text-muted hover:text-ink">View all <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </div>
    {children || <p className="rounded-soft border-2 border-dashed border-stone px-5 py-8 text-center text-sm text-muted">{empty}</p>}
  </section>
)

const Landing = () => (
  <div className="space-y-8 pb-8">
    <section className="club-surface relative overflow-hidden px-5 py-8 md:px-10 md:py-12">
      <div className="absolute right-6 top-5 text-2xl text-accent" aria-hidden="true">*</div>
      <div className="relative max-w-2xl club-rise">
        <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-accent">Your cozy corner for better notes</p>
        <h2 className="max-w-xl text-4xl font-bold leading-tight text-ink md:text-6xl">Make studying feel a little more like you.</h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">Browse bright study guides, collect the good bits, and build a review space that makes sense to your brain.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/login" className="club-shadow rounded-soft border-2 border-accent bg-accent px-5 py-3 font-extrabold text-paper transition-transform hover:-translate-y-1">Join the study club</Link>
          <Link to="/reviewer/public" className="rounded-soft border-2 border-stone bg-paper px-5 py-3 font-extrabold text-ink transition-colors hover:bg-butter">Browse public guides</Link>
        </div>
      </div>
      <img src="/logo.png" alt="A student studying with a laptop" className="pointer-events-none absolute -bottom-10 -right-8 hidden h-64 w-64 object-contain opacity-95 md:block lg:h-72 lg:w-72" />
    </section>
    <section className="grid gap-4 md:grid-cols-3" aria-label="Study club features">
      <article className="club-surface bg-blush/50 p-6"><div className="mb-5 text-2xl text-accent" aria-hidden="true">*</div><h3 className="text-2xl font-bold text-ink">Find your flow</h3><p className="mt-2 leading-relaxed text-muted">Discover public reviewers made by fellow students and start with the topics you need most.</p></article>
      <article className="club-surface bg-mint/60 p-6"><div className="mb-5 text-2xl text-accent" aria-hidden="true">+</div><h3 className="text-2xl font-bold text-ink">Make it yours</h3><p className="mt-2 leading-relaxed text-muted">Turn lecture notes into a colorful, structured guide that feels natural to revisit.</p></article>
      <article className="club-surface bg-butter/70 p-6"><div className="mb-5 text-2xl text-accent" aria-hidden="true">~</div><h3 className="text-2xl font-bold text-ink">Tiny wins count</h3><p className="mt-2 leading-relaxed text-muted">Keep the hard stuff approachable with clear blocks, gentle prompts, and a little delight.</p></article>
    </section>
  </div>
)

const Home = () => {
  const { user, isAuthenticated, isGuest } = useAuth()
  const [publicReviewers, setPublicReviewers] = useState([])
  const [myReviewers, setMyReviewers] = useState([])
  const [recentReviewers, setRecentReviewers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated && !isGuest) return
    const loadReviewers = async () => {
      setLoading(true)
      try {
        const publicResponse = await axios.get('/api/reviewers/public', { params: { limit: 50 } })
        setPublicReviewers(publicResponse.data.reviewers || [])
        if (isAuthenticated) {
          const myResponse = await axios.get('/api/reviewers/my', { withCredentials: true })
          setMyReviewers(myResponse.data.reviewers || [])
          setRecentReviewers(JSON.parse(window.localStorage.getItem(recentReviewersKey(user.id)) || '[]'))
        }
      } catch (loadError) {
        console.error('Failed to load home reviewers:', loadError)
        setError(getApiErrorMessage(loadError, 'Unable to load reviewers right now.'))
      } finally {
        setLoading(false)
      }
    }
    loadReviewers()
  }, [isAuthenticated, isGuest])

  if (!isAuthenticated) {
    return <div className="space-y-8"><ErrorAlert>{error}</ErrorAlert>{isGuest ? <section className="space-y-6 pb-8"><div><p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Guest library</p><h1 className="mt-2 text-4xl font-bold text-ink">Public reviewers</h1><p className="mt-2 text-muted">Browse study guides shared by the Review Well community.</p></div>{loading ? <ReviewerGridSkeleton /> : publicReviewers.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{publicReviewers.map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} />)}</div> : <p className="text-muted">No public reviewers are available yet.</p>}</section> : <Landing />}</div>
  }

  const sameCourse = publicReviewers.filter((reviewer) => isSameCourse(reviewer, user))

  return <div className="space-y-10 pb-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><img src={characterWaving} alt="Waving student illustration" className="mb-3 h-28 w-36 object-contain object-left" /><p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Good to see you, {user?.displayName?.split(' ')[0]}</p><h1 className="mt-2 text-4xl font-bold text-ink">Your study desk</h1><p className="mt-2 text-muted">Pick up where you left off or find your next review.</p></div><Link to="/create" className="flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-4 py-3 text-sm font-extrabold text-paper hover:-translate-y-0.5"><Plus className="h-4 w-4" aria-hidden="true" /> New reviewer</Link></div><ErrorAlert>{error}</ErrorAlert>{loading ? <div className="space-y-10"><div className="space-y-4"><Skeleton className="h-8 w-64" /><ReviewerGridSkeleton count={3} /></div><div className="space-y-4"><Skeleton className="h-8 w-72" /><ReviewerGridSkeleton count={3} /></div><div className="space-y-4"><Skeleton className="h-8 w-48" /><ReviewerGridSkeleton count={3} /></div></div> : <><Section icon={Clock3} title="Recently Viewed Reviewers" empty="Reviewers you open will show up here.">{recentReviewers.length > 0 && <div className="flex gap-4 overflow-x-auto pb-2">{recentReviewers.slice(0, 5).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} compact />)}</div>}</Section><Section icon={LibraryBig} title="Reviewers from the same course" to="/reviewer/public?course=mine" empty="No reviewers match your program yet.">{sameCourse.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sameCourse.slice(0, 3).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} />)}</div>}</Section><Section icon={BookOpen} title="My Reviewers" to="/reviewer/my" empty="Create your first reviewer to see it here.">{myReviewers.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{myReviewers.slice(0, 3).map((reviewer) => <ReviewerCard key={reviewer.id} reviewer={reviewer} />)}</div>}</Section></>}</div>
}

export default Home
