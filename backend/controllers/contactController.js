import { contactSchema } from '../validators/contact.js'
import { isConfigured, sendContactMessage } from '../services/mailer.js'

const sendMessage = async (req, res) => {
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid message' })
  }

  // The sender always comes from the signed-in account — never from client input.
  const fromEmail = req.user?.email
  if (!fromEmail) {
    return res.status(401).json({ error: 'Please sign in to send a message.' })
  }

  if (!isConfigured()) {
    return res.status(503).json({ error: 'Contact email is not configured yet. Please try again later.' })
  }

  try {
    await sendContactMessage({ message: parsed.data.message, fromEmail })
    res.json({ message: 'Message sent successfully' })
  } catch (error) {
    console.error('Contact message error:', error)
    res.status(502).json({ error: 'Unable to send your message right now. Please try again later.' })
  }
}

export { sendMessage }
