import * as pomodoroModel from '../models/pomodoroModel.js'
import * as reviewerModel from '../models/reviewerModel.js'

import { dayKey } from '../models/pomodoroModel.js'

// Single sessions longer than a day are rejected — they can only come from
// tampered timestamps and would distort today/week/goal stats.
const MAX_FOCUS_SECONDS = 24 * 60 * 60
const requireSignedIn = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'guest-write-blocked' })
    return false
  }
  return true
}

const createSession = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { reviewerId, breakSeconds = 0, startedAt, endedAt } = req.body || {}
    const started = new Date(startedAt)
    const ended = new Date(endedAt)
    if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) {
      return res.status(400).json({ error: 'startedAt and endedAt must be valid dates' })
    }
    if (ended <= started) {
      return res.status(400).json({ error: 'endedAt must be after startedAt' })
    }
    if (!Number.isInteger(breakSeconds) || breakSeconds < 0) {
      return res.status(400).json({ error: 'breakSeconds must be a non-negative integer' })
    }

    if (reviewerId !== undefined && reviewerId !== null) {
      const reviewer = await reviewerModel.findById(reviewerId)
      if (!reviewer) {
        return res.status(404).json({ error: 'Reviewer not found' })
      }
      if (
        (reviewer.visibility === 'private' || reviewer.isDraft) &&
        reviewer.authorId !== req.user.id
      ) {
        return res.status(403).json({ error: 'Not authorized to attach to this reviewer' })
      }
    }

    // focusSeconds is DERIVED from timestamps (authoritative server math);
    // any client-sent value is ignored so rows always match actual elapsed time.
    const focusSeconds = Math.round((ended.getTime() - started.getTime()) / 1000)
    if (focusSeconds > MAX_FOCUS_SECONDS) {
      return res.status(400).json({ error: 'focus duration must be at most 24 hours' })
    }

    const session = await pomodoroModel.create({
      userId: req.user.id,
      reviewerId: reviewerId ?? null,
      focusSeconds,
      breakSeconds,
      mode: 'focus',
      completed: true,
      startedAt: started,
      endedAt: ended,
    })
    res.status(201).json({ session })
  } catch (error) {
    console.error('Create pomodoro session error:', error)
    res.status(500).json({ error: 'Failed to save pomodoro session' })
  }
}

const getStats = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const sessions = await pomodoroModel.listCompletedByUser(req.user.id)
    const goal = await pomodoroModel.getDailyGoal(req.user.id)

    const today = new Date()
    const keys = []
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() - i)
      keys.push(dayKey(d))
    }
    const week = keys.map((key) =>
      sessions
        .filter((session) => dayKey(session.endedAt) === key)
        .reduce((total, session) => total + session.focusSeconds, 0)
    )

    res.json({
      todaySeconds: week[6],
      week,
      goal: goal ?? 25,
    })
  } catch (error) {
    console.error('Get pomodoro stats error:', error)
    res.status(500).json({ error: 'Failed to fetch pomodoro stats' })
  }
}

const updateGoal = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return

    const { dailyFocusMinutes } = req.body || {}
    if (!Number.isInteger(dailyFocusMinutes) || dailyFocusMinutes <= 0) {
      return res.status(400).json({ error: 'dailyFocusMinutes must be a positive integer' })
    }

    const updated = await pomodoroModel.setDailyGoal(req.user.id, dailyFocusMinutes)
    res.json({ dailyFocusMinutes: updated.dailyFocusMinutes })
  } catch (error) {
    console.error('Update focus goal error:', error)
    res.status(500).json({ error: 'Failed to update focus goal' })
  }
}

export { createSession, getStats, updateGoal }
