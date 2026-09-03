import { describe, it, expect, vi, beforeEach } from 'vitest'

const { verifyIdToken, getPayload } = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken,
  })),
}))

import { getGoogleUserInfo, verifyGoogleToken } from '../../../services/googleService.js'

describe('Google Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    verifyIdToken.mockResolvedValue({ getPayload })
    getPayload.mockReturnValue({
      sub: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    })
  })

  it('returns the verified Google token payload', async () => {
    const payload = await verifyGoogleToken('valid-token')

    expect(payload.sub).toBe('google-123')
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-token',
      audience: process.env.GOOGLE_CLIENT_ID,
    })
  })

  it('normalizes verified Google profile data', async () => {
    await expect(getGoogleUserInfo('valid-token')).resolves.toEqual({
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
    })
  })

  it('rejects missing tokens', async () => {
    await expect(verifyGoogleToken()).rejects.toThrow('Invalid Google token')
    expect(verifyIdToken).not.toHaveBeenCalled()
  })

  it('normalizes provider errors', async () => {
    verifyIdToken.mockRejectedValue(new Error('Provider error'))

    await expect(verifyGoogleToken('invalid-token')).rejects.toThrow('Invalid Google token')
  })
})
