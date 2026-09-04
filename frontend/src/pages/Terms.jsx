import { Link } from 'react-router-dom'
import { ArrowLeft, ScrollText } from 'lucide-react'

const Section = ({ title, children }) => (
  <section className="mt-6">
    <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
    <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">{children}</div>
  </section>
)

const Terms = () => (
  <div className="mx-auto max-w-2xl pb-10">
    <Link to="/about" className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to About
    </Link>

    <h1 className="mt-1 font-display text-4xl font-bold text-ink">Terms and Conditions</h1>

    <div className="mt-4 rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8">
      <Section title="The study club">
        <p>
          Review Well is a cozy place to collect notes, discover public reviewers, and build
          your own study guides. By creating an account you agree to use it for lawful,
          respectful studying.
        </p>
      </Section>
      <Section title="Your content">
        <p>
          You own the study guides you create. By marking a reviewer public or unlisted you
          give other members permission to view it. Keep sharing rights in mind: only upload
          lecture material you are allowed to share.
        </p>
      </Section>
      <Section title="Fair use">
        <p>
          Be kind: no spam, no harassment, no impersonation, and no attempts to break, scrape,
          or overload the service. AI extraction is rate-limited so the feature stays fast
          for everyone.
        </p>
      </Section>
      <Section title="Accounts">
        <p>
          You are responsible for activity under your account. If we spot abuse we may limit
          features or remove content and accounts that harm the club.
        </p>
      </Section>
      <Section title="As-is service">
        <p>
          Review Well is provided as-is for studying. We do our best to keep it reliable, but
          we cannot guarantee uninterrupted access or the accuracy of AI-generated summaries —
          always double-check against your course material.
        </p>
      </Section>
    </div>
  </div>
)

export default Terms
