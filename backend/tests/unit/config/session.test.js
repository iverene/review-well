import { describe, it, expect, vi } from 'vitest'

import {
  ensureSessionCompat,
  enforceAbsoluteSessionExpiry,
  ABSOLUTE_SESSION_MAX_AGE_MS,
} from '../../../config/session.js'

const runMiddleware = (req) => new Promise((resolve) => {
  ensureSessionCompat(req, {}, resolve)
})

describe('ensureSessionCompat', () => {
  it('adds regenerate and save shims to a stateless session', async () => {
    const req = { session: { passport: { user: 'user-123' } } }

    await runMiddleware(req)

    expect(typeof req.session.regenerate).toBe('function')
    expect(typeof req.session.save).toBe('function')

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()))
    })
    expect(req.session.passport).toEqual({ user: 'user-123' })

    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()))
    })
  })

  it('never overrides a real session store implementation', async () => {
    const regenerate = vi.fn((cb) => cb(null))
    const save = vi.fn((cb) => cb(null))
    const req = { session: { regenerate, save } }

    await runMiddleware(req)

    expect(req.session.regenerate).toBe(regenerate)
    expect(req.session.save).toBe(save)
  })

  it('passes through requests without a session', async () => {
    await runMiddleware({})
  })
})

describe('enforceAbsoluteSessionExpiry', () => {
  const DAY = 24 * 60 * 60 * 1000

  const runExpiry = (req) => new Promise((resolve) => {
    enforceAbsoluteSessionExpiry(req, {}, resolve)
  })

  it('stamps loginAt once and lets fresh sessions through', async () => {
    const req = { user: { id: 'u1' }, session: {} }
    await runExpiry(req)
    expect(typeof req.session.loginAt).toBe('number')
    expect(ABSOLUTE_SESSION_MAX_AGE_MS).toBe(30 * DAY)
  })

  it('destroys sessions older than 30 days', async () => {
    const req = {
      user: { id: 'u1' },
      session: { loginAt: Date.now() - 31 * DAY },
      logout: (cb) => cb(),
    }
    await runExpiry(req)
    expect(req.session).toBeNull()
  })

  it('lets active sessions within the window through untouched', async () => {
    const session = { loginAt: Date.now() - 6 * DAY }
    const req = { user: { id: 'u1' }, session }
    await runExpiry(req)
    expect(req.session).toBe(session)
  })

  it('passes anonymous requests straight through', async () => {
    const req = { session: {} }
    await runExpiry(req)
    expect(req.session).toEqual({})
  })
})
