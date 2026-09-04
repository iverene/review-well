import express from 'express'
import { sendMessage } from '../controllers/contactController.js'
import { requireAuth } from '../middleware/auth.js'

const app = express.Router()

// Signed-in users only: the message is always sent from the account email,
// so senders cannot be forged through client input
app.post('/', requireAuth, sendMessage)

export default app
