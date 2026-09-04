import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { LogIn, Mail, PartyPopper, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const Contact = () => {
  const { user, isAuthenticated } = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  // Locked to the signed-in account: valid by construction, never editable.
  const senderEmail = user?.email || ''

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      await axios.post('/api/contact', { email: senderEmail, message: message.trim() }, { withCredentials: true })
      setSent(true)
      setMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(getApiErrorMessage(err, 'Unable to send your message.'))
    } finally {
      setSending(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl pb-10">
        <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-accent">
          <Mail className="h-4 w-4" aria-hidden="true" /> Say hello
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Contact</h1>
        <section className="mt-5 rounded-soft border-2 border-stone bg-paper p-6 text-center club-shadow sm:p-8" aria-label="Sign in required">
          <LogIn className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-bold text-ink">Sign in to send a message</p>
          <p className="mt-1 text-sm text-muted">
            Messages are sent from your account email so we know they are really from you.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-6 py-2.5 text-sm font-extrabold text-paper hover:-translate-y-0.5"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" /> Sign in with Google
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-accent">
        <Mail className="h-4 w-4" aria-hidden="true" /> Say hello
      </p>
      <h1 className="mt-1 font-display text-4xl font-bold text-ink">Contact</h1>
      <p className="mt-2 leading-relaxed text-muted">
        Questions, ideas, or a study-club story to share? Send a message and it lands directly
        in the developer inbox.
      </p>

      <section className="mt-5 rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8" aria-label="Contact form">
        {sent ? (
          <div className="py-6 text-center" role="status">
            <PartyPopper className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
            <p className="mt-3 font-display text-xl font-bold text-ink">Message sent</p>
            <p className="mt-1 text-sm text-muted">Thanks for reaching out — we will get back to you soon.</p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder"
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorAlert>{error}</ErrorAlert>
            <div>
              <label htmlFor="contact-email" className="mb-1 block text-sm font-extrabold text-ink">
                Sending as
              </label>
              <input
                id="contact-email"
                type="email"
                readOnly
                value={senderEmail}
                aria-readonly="true"
                title="Locked to your signed-in account"
                className="w-full cursor-not-allowed rounded-soft border-2 border-stone bg-stone/40 px-4 py-2.5 text-muted focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">Locked to your account so every message is verifiably from you.</p>
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-1 block text-sm font-extrabold text-ink">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={6}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what is on your mind…"
                className="w-full resize-y rounded-soft border-2 border-stone bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-right text-xs text-muted">{message.length}/2000</p>
            </div>
            <div className="flex justify-end border-t-2 border-stone pt-5">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-6 py-2.5 text-sm font-extrabold text-paper hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default Contact
