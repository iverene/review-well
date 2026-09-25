import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// DB-touching helpers are stubbed so route tests never hit Prisma. (The
// global setup.js Prisma mock has no pomodoroSession delegate, so the model
// module itself must be mocked — same convention as blurting.test.js.)
vi.mock('../../models/pomodoroModel.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    create: vi.fn(),
    listCompletedByUser: vi.fn(),
    getDailyGoal: vi.fn(),
    setDailyGoal: vi.fn(),
  }
})
vi.mock('../../models/reviewerModel.js', () => ({
  findById: vi.fn(),
}))

import pomodoroRoutes from '../../routes/pomodoroRoutes.js'
import * as pomodoroModel from '../../models/pomodoroModel.js'
import * as reviewerModel from '../../models/reviewerModel.js'
import { createSession } from '../../controllers/pomodoroController.js'

// NOTE: mirrors blurting.test.js — no global app helpers exist, so each
// test builds a local app and injects req.user via a stub middleware. The
// router defines full paths and mounts at /api (final URLs are exactly
// POST /api/pomodoro/sessions, GET /api/pomodoro/stats and
// PATCH /api/users/me/goal).
const createApp = (user) => {
  const app = express()
  app.use(express.json())
  if (user !== null) {
    app.use((req, res, next) => {
      req.user = user
      next()
    })
  }
  app.use('/api', pomodoroRoutes)
  return app
}

const OWNER = { id: 'user-123' }

// Noon UTC anchors keep day-key math deterministic (no midnight flakiness).
const noonToday = () => {
  const d = new Date()
  d.setUTCHours(12, 0, 0, 0)
  return d
}
const endedAtDaysAgo = (n) => {
  const d = noonToday()
  d.setUTCDate(d.getUTCDate() - n)
  return d
}

describe('Pomodoro Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/pomodoro/sessions', () => {
    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .send({
          reviewerId: 'reviewer-1',
          focusSeconds: 1500,
          startedAt: new Date(Date.now() - 1500 * 1000).toISOString(),
          endedAt: new Date().toISOString(),
        })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('guest-write-blocked')
    })

    it('should derive focusSeconds from timestamps, ignoring the client value', async () => {
      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: OWNER.id, visibility: 'public' })
      pomodoroModel.create.mockImplementation(async (data) => ({ id: 'session-1', ...data }))

      const startedAt = new Date(Date.now() - 1500 * 1000).toISOString()
      const endedAt = new Date().toISOString()
      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .send({ reviewerId: 'reviewer-1', focusSeconds: 999, breakSeconds: 300, startedAt, endedAt })

      expect(response.status).toBe(201)
      expect(response.body.session.focusSeconds).toBe(1500)
      expect(pomodoroModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: OWNER.id, reviewerId: 'reviewer-1', focusSeconds: 1500 })
      )
    })

    it('should return 400 when endedAt is not after startedAt', async () => {
      const now = new Date().toISOString()
      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .send({ reviewerId: 'reviewer-1', focusSeconds: 1500, startedAt: now, endedAt: now })

      expect(response.status).toBe(400)
      expect(pomodoroModel.create).not.toHaveBeenCalled()
    })

    it('controller defends without a signed-in user even if the route guard is bypassed', async () => {
      const req = { user: null, body: {} }
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() }
      await createSession(req, res)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(pomodoroModel.create).not.toHaveBeenCalled()
    })

    it('should return 404 for an unknown reviewerId', async () => {
      reviewerModel.findById.mockResolvedValue(null)

      const startedAt = new Date(Date.now() - 1500 * 1000).toISOString()
      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .send({ reviewerId: 'ghost', startedAt, endedAt: new Date().toISOString() })

      expect(response.status).toBe(404)
      expect(pomodoroModel.create).not.toHaveBeenCalled()
    })

    it('should return 403 for another user private reviewer', async () => {
      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-9', authorId: 'owner-9', visibility: 'private' })

      const startedAt = new Date(Date.now() - 1500 * 1000).toISOString()
      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .send({ reviewerId: 'reviewer-9', startedAt, endedAt: new Date().toISOString() })

      expect(response.status).toBe(403)
      expect(pomodoroModel.create).not.toHaveBeenCalled()
    })

    it('should return 400 for absurd durations over 24 hours', async () => {
      reviewerModel.findById.mockResolvedValue({ id: 'reviewer-1', authorId: OWNER.id, visibility: 'public' })

      const startedAt = new Date(Date.now() - 25 * 3600 * 1000).toISOString()
      const app = createApp(OWNER)
      const response = await request(app)
        .post('/api/pomodoro/sessions')
        .send({ reviewerId: 'reviewer-1', startedAt, endedAt: new Date().toISOString() })

      expect(response.status).toBe(400)
      expect(pomodoroModel.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/pomodoro/stats', () => {
    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app).get('/api/pomodoro/stats')

      expect(response.status).toBe(401)
    })

    it('should return todaySeconds, a 7-bucket week, and goal', async () => {
      pomodoroModel.listCompletedByUser.mockResolvedValue([
        { id: 's1', focusSeconds: 600, endedAt: endedAtDaysAgo(0) },
        { id: 's2', focusSeconds: 600, endedAt: endedAtDaysAgo(0) },
        { id: 's3', focusSeconds: 300, endedAt: endedAtDaysAgo(1) },
      ])
      pomodoroModel.getDailyGoal.mockResolvedValue(30)

      const app = createApp(OWNER)
      const response = await request(app).get('/api/pomodoro/stats')

      expect(response.status).toBe(200)
      expect(response.body.todaySeconds).toBe(1200)
      expect(response.body.week).toHaveLength(7)
      expect(response.body.week.reduce((a, b) => a + b, 0)).toBe(1500)
      expect(response.body.week[6]).toBe(1200)
      expect(response.body.goal).toBe(30)
      expect(response.body.streak).toBeUndefined()
    })
  })

  describe('PATCH /api/users/me/goal', () => {
    it('should return 401 guest-write-blocked when not signed in', async () => {
      const app = createApp(null)
      const response = await request(app)
        .patch('/api/users/me/goal')
        .send({ dailyFocusMinutes: 45 })

      expect(response.status).toBe(401)
    })

    it('should persist a valid positive-integer goal', async () => {
      pomodoroModel.setDailyGoal.mockImplementation(async (userId, minutes) => ({
        id: userId,
        dailyFocusMinutes: minutes,
      }))

      const app = createApp(OWNER)
      const response = await request(app)
        .patch('/api/users/me/goal')
        .send({ dailyFocusMinutes: 45 })

      expect(response.status).toBe(200)
      expect(response.body.dailyFocusMinutes).toBe(45)
      expect(pomodoroModel.setDailyGoal).toHaveBeenCalledWith(OWNER.id, 45)
    })

    it.each([0, -5, 2.5, 'lots', null])('should reject invalid goal %p with 400', async (bad) => {
      const app = createApp(OWNER)
      const response = await request(app)
        .patch('/api/users/me/goal')
        .send({ dailyFocusMinutes: bad })

      expect(response.status).toBe(400)
      expect(pomodoroModel.setDailyGoal).not.toHaveBeenCalled()
    })
  })
})
