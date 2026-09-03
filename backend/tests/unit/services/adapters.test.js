import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
  })),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    upload: vi.fn().mockResolvedValue({ data: { path: 'test.pdf' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.pdf' } }),
  }),
}))

import { createGoogleAuthAdapter } from '../../../services/adapters/googleAuth.js'
import { createStorageAdapter } from '../../../services/adapters/storage.js'

describe('Google Auth Adapter', () => {
  let adapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = createGoogleAuthAdapter()
  })

  it('should create adapter with verifyIdToken method', () => {
    expect(adapter.verifyIdToken).toBeDefined()
    expect(typeof adapter.verifyIdToken).toBe('function')
  })

  it('should throw error for invalid token', async () => {
    await expect(adapter.verifyIdToken('invalid-token')).rejects.toThrow('Invalid Google token')
  })
})

describe('Storage Adapter', () => {
  it('should return error when not configured', async () => {
    const adapter = createStorageAdapter()
    const result = await adapter.upload({}, 'test.pdf')
    expect(result.error).toBe('Storage not configured')
  })
})
