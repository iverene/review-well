import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGoogleAuthAdapter } from '../../../services/adapters/googleAuth.js'
import { createSendGridAdapter } from '../../../services/adapters/sendgrid.js'
import { createOpenRouterAdapter } from '../../../services/adapters/openrouter.js'
import { createStorageAdapter } from '../../../services/adapters/storage.js'

describe('Google Auth Adapter', () => {
  let adapter

  beforeEach(() => {
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

describe('SendGrid Adapter', () => {
  let adapter

  beforeEach(() => {
    adapter = createSendGridAdapter()
  })

  it('should create adapter with send methods', () => {
    expect(adapter.send).toBeDefined()
    expect(adapter.sendVerificationEmail).toBeDefined()
    expect(adapter.sendWelcomeEmail).toBeDefined()
  })

  it('should skip email when not configured', async () => {
    const result = await adapter.send({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    })
    expect(result.statusCode).toBe(200)
  })
})

describe('OpenRouter Adapter', () => {
  let adapter

  beforeEach(() => {
    adapter = createOpenRouterAdapter()
  })

  it('should create adapter with chat and extractStudyBlocks methods', () => {
    expect(adapter.chat).toBeDefined()
    expect(adapter.extractStudyBlocks).toBeDefined()
  })

  it('should return mock response when not configured', async () => {
    const result = await adapter.chat([{ role: 'user', content: 'test' }])
    expect(result.choices).toBeDefined()
    expect(result.choices[0].message.content).toBeDefined()
  })

  it('should parse mock extraction response', async () => {
    const blocks = await adapter.extractStudyBlocks('Test content')
    expect(Array.isArray(blocks)).toBe(true)
    expect(blocks[0].block_type).toBeDefined()
  })
})

describe('Storage Adapter', () => {
  it('should return error when not configured', async () => {
    const adapter = createStorageAdapter()
    const result = await adapter.upload({}, 'test.pdf')
    expect(result.error).toBe('Storage not configured')
  })
})
