import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../../models/pushSubscriptionModel.js', () => ({
  upsert: vi.fn(),
  removeByEndpoint: vi.fn(),
  listByUserIds: vi.fn(),
  removeByEndpointGlobal: vi.fn(),
}))

import pushRoutes from '../../routes/pushRoutes.js'
import * as pushSubscriptionModel from '../../models/pushSubscriptionModel.js'
import { formatPayload } from '../../services/pushService.js'

const createApp = (user) => {
  const app = express()
  app.use(express.json())
  if (user !== null) {
    app.use((req, res, next) => {
      req.user = user
      next()
    })
  }
  app.use('/api/push', pushRoutes)
  return app
}

const OWNER = { id: 'user-123' }

describe('Push Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the VAPID public key without auth', async () => {
    const app = createApp(null)
    const response = await request(app).get('/api/push/vapid-public-key')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('publicKey')
  })

  it('should store a valid subscription', async () => {
    pushSubscriptionModel.upsert.mockResolvedValue({ id: 'sub-1' })

    const app = createApp(OWNER)
    const response = await request(app)
      .post('/api/push/subscribe')
      .send({ endpoint: 'https://push.example.com/sub', keys: { p256dh: 'k1', auth: 'k2' } })

    expect(response.status).toBe(201)
    expect(pushSubscriptionModel.upsert).toHaveBeenCalledWith(OWNER.id, {
      endpoint: 'https://push.example.com/sub',
      keys: { p256dh: 'k1', auth: 'k2' },
    })
  })

  it('should reject invalid subscriptions with 400', async () => {
    const app = createApp(OWNER)
    const response = await request(app)
      .post('/api/push/subscribe')
      .send({ endpoint: 'http://insecure.example.com/sub', keys: {} })

    expect(response.status).toBe(400)
    expect(pushSubscriptionModel.upsert).not.toHaveBeenCalled()
  })

  it('should remove a subscription on unsubscribe', async () => {
    pushSubscriptionModel.removeByEndpoint.mockResolvedValue({ count: 1 })

    const app = createApp(OWNER)
    const response = await request(app)
      .delete('/api/push/unsubscribe')
      .send({ endpoint: 'https://push.example.com/sub' })

    expect(response.status).toBe(200)
    expect(pushSubscriptionModel.removeByEndpoint).toHaveBeenCalledWith(OWNER.id, 'https://push.example.com/sub')
  })
})

describe('formatPayload', () => {
  it('formats follow, save, and new_reviewer pushes with deep links', () => {
    expect(formatPayload({ actionType: 'follow', actorName: 'Ann' })).toMatchObject({
      title: 'New Follower',
      url: '/friends',
    })
    expect(formatPayload({ actionType: 'save', actorName: 'Ann', reviewerTitle: 'Bio', reviewerId: 'r1' })).toMatchObject({
      title: 'Reviewer Saved',
      url: '/reviewer/r1',
    })
    expect(formatPayload({ actionType: 'new_reviewer', actorName: 'Ann', reviewerTitle: 'Bio', reviewerId: 'r1' })).toMatchObject({
      title: 'New Reviewer',
      url: '/reviewer/r1',
    })
  })
})
