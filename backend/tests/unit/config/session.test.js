import { describe, it, expect, vi } from 'vitest'

import { ensureSessionCompat } from '../../../config/session.js'

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
