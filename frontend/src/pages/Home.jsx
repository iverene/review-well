import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Home() {
  const { isAuthenticated, isGuest } = useAuth()

  return (
    <div className="space-y-8 pb-8">
      <section className="club-surface relative overflow-hidden px-5 py-8 md:px-10 md:py-12">
        <div className="absolute right-6 top-5 text-2xl text-accent" aria-hidden="true">✦</div>
        <div className="relative max-w-2xl club-rise">
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-accent">Your cozy corner for better notes</p>
          <h2 className="max-w-xl text-4xl font-bold leading-tight text-ink md:text-6xl">
            Make studying feel a little more like you.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Browse bright study guides, collect the good bits, and build a review space that makes sense to your brain.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/create" className="club-shadow rounded-soft border-2 border-accent bg-accent px-5 py-3 font-extrabold text-paper transition-transform hover:-translate-y-1">Create a reviewer</Link>
            ) : isGuest ? (
              <span className="rounded-soft border-2 border-stone bg-powder px-5 py-3 font-extrabold text-ink">Browsing as a guest</span>
            ) : (
              <Link to="/login" className="club-shadow rounded-soft border-2 border-accent bg-accent px-5 py-3 font-extrabold text-paper transition-transform hover:-translate-y-1">Join the study club</Link>
            )}
            <Link to="/reviewer/public" className="rounded-soft border-2 border-stone bg-paper px-5 py-3 font-extrabold text-ink transition-colors hover:bg-butter">Browse public guides</Link>
          </div>
        </div>
        <img src="/logo.png" alt="A student studying with a laptop" className="pointer-events-none absolute -bottom-10 -right-8 hidden h-64 w-64 object-contain opacity-95 md:block lg:h-72 lg:w-72" />
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Study club features">
        <article className="club-surface club-rise club-rise-delay-1 bg-blush/50 p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-paper text-2xl" aria-hidden="true">♡</div>
          <h3 className="text-2xl font-bold text-ink">Find your flow</h3>
          <p className="mt-2 leading-relaxed text-muted">Discover public reviewers made by fellow students and start with the topics you need most.</p>
        </article>
        <article className="club-surface club-rise club-rise-delay-2 bg-mint/60 p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-paper text-2xl" aria-hidden="true">✎</div>
          <h3 className="text-2xl font-bold text-ink">Make it yours</h3>
          <p className="mt-2 leading-relaxed text-muted">Turn lecture notes into a colorful, structured guide that feels natural to revisit.</p>
        </article>
        <article className="club-surface bg-butter/70 p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-paper text-2xl" aria-hidden="true">✦</div>
          <h3 className="text-2xl font-bold text-ink">Tiny wins count</h3>
          <p className="mt-2 leading-relaxed text-muted">Keep the hard stuff approachable with clear blocks, gentle prompts, and a little delight.</p>
        </article>
      </section>
    </div>
  )
}

export default Home
