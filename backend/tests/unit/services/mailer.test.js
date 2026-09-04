import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { isConfigured, sendContactMessage } from '../../../services/mailer.js'

describe('Mailer (Resend)', () => {
  const env = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...env }
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env = env
    vi.unstubAllGlobals()
  })

  it('reports unconfigured without a key or recipient', () => {
    delete process.env.RESEND_API_KEY
    delete process.env.CONTACT_EMAIL
    expect(isConfigured()).toBe(false)
  })

  it('posts the message to the Resend API when configured', async () => {
    process.env.RESEND_API_KEY = 're_test-key'
    process.env.CONTACT_EMAIL = 'dev@example.com'
    fetch.mockResolvedValue({ ok: true })

    await sendContactMessage({ fromEmail: 'student@example.com', message: 'Hello' })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer re_test-key' }),
      })
    )
    const payload = JSON.parse(fetch.mock.calls[0][1].body)
    expect(payload).toMatchObject({
      to: ['dev@example.com'],
      replyTo: 'student@example.com',
    })
    expect(payload.text).toContain('Hello')
  })

  it('throws when Resend rejects the message', async () => {
    process.env.RESEND_API_KEY = 're_test-key'
    process.env.CONTACT_EMAIL = 'dev@example.com'
    fetch.mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' })

    await expect(sendContactMessage({ fromEmail: 'a@b.c', message: 'Hi' })).rejects.toThrow('401')
  })

  it('throws when unconfigured', async () => {
    delete process.env.RESEND_API_KEY
    await expect(sendContactMessage({ fromEmail: 'a@b.c', message: 'Hi' })).rejects.toThrow('not configured')
    expect(fetch).not.toHaveBeenCalled()
  })
})
