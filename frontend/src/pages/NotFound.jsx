import { Link } from 'react-router-dom'
import { ArrowLeft, LibraryBig } from 'lucide-react'

import characterWaving from '../assets/character-waving.webp'

// Catch-all for unknown URLs, which previously rendered an empty page.
const NotFound = () => (
  <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
    <img src={characterWaving} alt="" aria-hidden="true" className="h-28 w-32 object-contain" />
    <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-accent">Page not found</p>
    <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">This page wandered off</h1>
    <p className="mt-3 text-muted">The link may be old, or the page was moved. Let&apos;s get you back to studying.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link to="/" className="inline-flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-5 py-2.5 text-sm font-extrabold text-paper hover:-translate-y-0.5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back home
      </Link>
      <Link to="/reviewer/public" className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-5 py-2.5 text-sm font-extrabold text-ink hover:bg-cream">
        <LibraryBig className="h-4 w-4" aria-hidden="true" /> Public reviewers
      </Link>
    </div>
  </div>
)

export default NotFound
