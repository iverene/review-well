import { z } from 'zod'

const contactSchema = z.object({
  // Email is accepted for compatibility but never trusted: the controller
  // always sends from the authenticated session user's address.
  email: z.string().trim().email('Enter a valid email address').max(254).optional(),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message must be 2000 characters or less'),
})

export { contactSchema }
