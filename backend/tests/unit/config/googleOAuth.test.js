import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../models/userModel.js', () => ({
  findByGoogleId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}))

import { verifyGoogleUser } from '../../../config/googleOAuth.js'
import * as userModel from '../../../models/userModel.js'

const runVerify = (profile) => new Promise((resolve) => {
  verifyGoogleUser(null, null, profile, (err, user) => resolve({ err, user }))
})

const profile = {
  id: 'google-123',
  displayName: 'Test User',
  emails: [{ value: 'test@example.com' }],
  photos: [{ value: 'https://example.com/avatar.jpg' }],
}

describe('verifyGoogleUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a user on first sign-in', async () => {
    userModel.findByGoogleId.mockResolvedValue(null)
    userModel.create.mockResolvedValue({ id: 'user-1' })

    const { err, user } = await runVerify(profile)

    expect(err).toBeNull()
    expect(user).toEqual({ id: 'user-1' })
    expect(userModel.create).toHaveBeenCalledWith({
      googleId: 'google-123',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    })
  })

  it('returns the existing user unchanged when profile matches', async () => {
    const existing = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    }
    userModel.findByGoogleId.mockResolvedValue(existing)

    const { err, user } = await runVerify(profile)

    expect(err).toBeNull()
    expect(user).toBe(existing)
    expect(userModel.update).not.toHaveBeenCalled()
  })

  it('syncs changed email, name, or avatar', async () => {
    userModel.findByGoogleId.mockResolvedValue({ id: 'user-1', email: 'old@example.com' })
    userModel.update.mockResolvedValue({ id: 'user-1' })

    const { err } = await runVerify(profile)

    expect(err).toBeNull()
    expect(userModel.update).toHaveBeenCalledWith('user-1', {
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    })
  })

  it('fails cleanly when Google provides no email', async () => {
    const { err, user } = await runVerify({ ...profile, emails: [] })

    expect(err).toBeInstanceOf(Error)
    expect(user).toBeUndefined()
    expect(userModel.create).not.toHaveBeenCalled()
  })

  it('passes database errors to done', async () => {
    userModel.findByGoogleId.mockRejectedValue(new Error('DB down'))

    const { err, user } = await runVerify(profile)

    expect(err).toBeInstanceOf(Error)
    expect(user).toBeNull()
  })
})
