import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mailerMock } = vi.hoisted(() => ({
  mailerMock: {
    isConfigured: vi.fn(),
    sendContactMessage: vi.fn(),
  },
}))

vi.mock('../../../services/mailer.js', () => mailerMock)

import { sendMessage } from '../../../controllers/contactController.js'
import { createMockRequest, createMockResponse } from '../../helpers/mocks.js'

describe('Contact Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send a valid message from the session email', async () => {
    const req = createMockRequest({ body: { email: 'student@example.com', message: 'Hello there' } })
    const res = createMockResponse()

    mailerMock.isConfigured.mockReturnValue(true)
    mailerMock.sendContactMessage.mockResolvedValue()

    await sendMessage(req, res)

    expect(mailerMock.sendContactMessage).toHaveBeenCalledWith({
      fromEmail: 'test@example.com',
      message: 'Hello there',
    })
    expect(res.json).toHaveBeenCalledWith({ message: 'Message sent successfully' })
  })

  it('should ignore a forged sender and use the session email', async () => {
    const req = createMockRequest({ body: { email: 'impostor@evil.com', message: 'Hello there' } })
    const res = createMockResponse()

    mailerMock.isConfigured.mockReturnValue(true)
    mailerMock.sendContactMessage.mockResolvedValue()

    await sendMessage(req, res)

    expect(mailerMock.sendContactMessage).toHaveBeenCalledWith({
      fromEmail: 'test@example.com',
      message: 'Hello there',
    })
  })

  it('should return 401 without a session email', async () => {
    const req = createMockRequest({ user: { id: 'user-123' }, body: { message: 'Hello there' } })
    const res = createMockResponse()

    await sendMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(mailerMock.sendContactMessage).not.toHaveBeenCalled()
  })

  it('should return 400 for an invalid email', async () => {
    const req = createMockRequest({ body: { email: 'not-an-email', message: 'Hello' } })
    const res = createMockResponse()

    await sendMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(mailerMock.sendContactMessage).not.toHaveBeenCalled()
  })

  it('should return 400 for an empty message', async () => {
    const req = createMockRequest({ body: { email: 'student@example.com', message: '   ' } })
    const res = createMockResponse()

    await sendMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should return 503 when contact email is not configured', async () => {
    const req = createMockRequest({ body: { email: 'student@example.com', message: 'Hello' } })
    const res = createMockResponse()

    mailerMock.isConfigured.mockReturnValue(false)

    await sendMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(mailerMock.sendContactMessage).not.toHaveBeenCalled()
  })

  it('should return 502 when sending fails', async () => {
    const req = createMockRequest({ body: { email: 'student@example.com', message: 'Hello' } })
    const res = createMockResponse()

    mailerMock.isConfigured.mockReturnValue(true)
    mailerMock.sendContactMessage.mockRejectedValue(new Error('SMTP down'))

    await sendMessage(req, res)

    expect(res.status).toHaveBeenCalledWith(502)
  })
})
