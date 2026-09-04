import { Link } from 'react-router-dom'
import { BookOpen, FileText, ShieldCheck, Sparkles, Users } from 'lucide-react'

const Feature = ({ icon: Icon, title, children }) => (
  <div className="rounded-soft border-2 border-stone bg-paper p-5">
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush" aria-hidden="true">
      <Icon className="h-5 w-5 text-ink" />
    </span>
    <h2 className="mt-3 font-display text-lg font-bold text-ink">{title}</h2>
    <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>
  </div>
)

const About = () => (
  <div className="mx-auto max-w-3xl pb-10">
    <section className="club-surface relative overflow-hidden px-5 py-8 md:px-10 md:py-12">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <img src="/logo.png" alt="" className="h-20 w-20 shrink-0 rounded-soft object-contain" />
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">The study club</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-ink">About Review Well</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">
            Review Well helps students turn scattered notes into calm, useful study spaces —
            a cozy shared table where every reviewer feels like opening a favorite notebook.
          </p>
        </div>
      </div>
    </section>

    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Feature icon={FileText} title="Docs-style workspace">
        Arrange lesson banners, topics, tables, and terms cards on bounded, printable sheets with themes and paper sizes.
      </Feature>
      <Feature icon={Sparkles} title="AI extraction">
        Upload lecture slides and watch them unfold into structured notes, headings, and summaries.
      </Feature>
      <Feature icon={Users} title="Study buddies">
        Find friends, follow their guides, bookmark favorites, and share reviewers with a link.
      </Feature>
      <Feature icon={BookOpen} title="Learn the ropes">
        New here? The <Link to="/guide" className="font-bold text-accent hover:underline">Review Well guide</Link> walks
        through every menu, shortcut, and workflow.
      </Feature>
    </div>

    <section className="mt-6 rounded-soft border-2 border-stone bg-paper p-6 club-shadow" aria-label="More from Review Well">
      <h2 className="font-display text-xl font-bold text-ink">More from Review Well</h2>
      <div className="mt-3 flex flex-col gap-1 text-sm font-bold">
        <Link to="/guide" className="rounded-soft px-2 py-2 text-ink hover:bg-powder">Review Well guide</Link>
        <Link to="/contact" className="rounded-soft px-2 py-2 text-ink hover:bg-powder">Contact us</Link>
        <Link to="/privacy" className="inline-flex items-center gap-2 rounded-soft px-2 py-2 text-ink hover:bg-powder">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" /> Privacy Policy
        </Link>
        <Link to="/terms" className="inline-flex items-center gap-2 rounded-soft px-2 py-2 text-ink hover:bg-powder">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" /> Terms and Conditions
        </Link>
      </div>
    </section>
  </div>
)

export default About
