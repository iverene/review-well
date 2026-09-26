import express from 'express'

import { requireAuth } from '../middleware/auth.js'
import * as pushSubscriptionModel from '../models/pushSubscriptionModel.js'
import { vapidPublicKey } from '../services/pushService.js'

const app = express.Router()

// VAPID public key for client subscription (safe to expose).
app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidPublicKey() })
})

// Register (or reassign) a browser push subscription for the signed-in user.
app.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {}
    if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
      return res.status(400).json({ error: 'A valid push endpoint is required' })
    }
    if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
      return res.status(400).json({ error: 'Push subscription keys are required' })
    }

    const subscription = await pushSubscriptionModel.upsert(req.user.id, { endpoint, keys })
    res.status(201).json({ id: subscription.id })
  } catch (error) {
    console.error('Push subscribe error:', error)
    res.status(500).json({ error: 'Failed to save push subscription' })
  }
})

app.delete('/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body || {}
    if (typeof endpoint !== 'string' || !endpoint) {
      return res.status(400).json({ error: 'A push endpoint is required' })
    }

    await pushSubscriptionModel.removeByEndpoint(req.user.id, endpoint)
    res.json({ success: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    res.status(500).json({ error: 'Failed to remove push subscription' })
  }
})

export default app
