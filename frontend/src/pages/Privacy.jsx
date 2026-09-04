import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

const Section = ({ title, children }) => (
  <section className="mt-6">
    <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
    <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">{children}</div>
  </section>
)

const Privacy = () => (
  <div className="mx-auto max-w-2xl pb-10">
    <h1 className="mt-1 font-display text-4xl font-bold text-ink">Privacy Policy</h1>

    <div className="mt-4 rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8">
      <Section title="What we collect">
        <p>
          When you sign in with Google we store your name, email address, and profile photo,
          plus the school details you add to your profile. Your study guides, saved reviewers,
          follows, and uploaded files are stored so the app can show them back to you.
        </p>
      </Section>
      <Section title="How we use it">
        <p>
          Your information runs the study club: signing you in, displaying your profile and
          reviewers, powering follows, saves, notifications, and AI extraction. We never sell
          your personal information.
        </p>
      </Section>
      <Section title="Sharing">
        <p>
          Reviewers you mark <b>public</b> can be discovered by anyone. <b>Unlisted</b> reviewers
          are visible only to people with the link. <b>Private</b> reviewers are visible only
          to you. Your email address is never shown on public pages.
        </p>
      </Section>
      <Section title="Cookies and sessions">
        <p>
          We use a single secure, HttpOnly session cookie to keep you signed in. Guest browsing
          is stored only in your own browser and never touches our servers.
        </p>
      </Section>
      <Section title="Your choices">
        <p>
          You can edit your profile in Settings, change a reviewer back to private at any time,
          remove saved reviewers, and sign out to end your session. Contact us any time with
          questions about your data.
        </p>
      </Section>
    </div>
  </div>
)

export default Privacy
