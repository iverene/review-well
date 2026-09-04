// Free transactional email via the Resend HTTPS API
// (free tier: 3,000 emails/month, no credit card, no SMTP server to run).
// Setup: sign up at resend.com, create an API key, and set RESEND_API_KEY
// plus CONTACT_EMAIL in .env. Without a verified domain, send from the
// default onboarding address — perfect for contact mail to your own inbox.

const RESEND_API_URL = 'https://api.resend.com/emails'

const isConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL)

const sendContactMessage = async ({ fromEmail, message }) => {
  if (!isConfigured()) {
    throw new Error('Contact email is not configured')
  }
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Review Well <onboarding@resend.dev>',
      to: [process.env.CONTACT_EMAIL],
      replyTo: fromEmail,
      subject: `Review Well contact from ${fromEmail}`,
      text: `From: ${fromEmail}\n\n${message}`,
    }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Resend rejected the message (${response.status})${detail ? `: ${detail}` : ''}`)
  }
}

export { isConfigured, sendContactMessage }
