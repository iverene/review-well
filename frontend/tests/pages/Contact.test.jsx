import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import Contact from '../../src/pages/Contact'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('axios')
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('Contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: { email: 'student@example.com' }, isAuthenticated: true })
  })

  it('locks the email to the signed-in account', () => {
    render(<MemoryRouter><Contact /></MemoryRouter>)
    const input = screen.getByLabelText('Sending as')
    expect(input).toHaveValue('student@example.com')
    expect(input).toHaveAttribute('readonly')
  })

  it('asks guests to sign in instead of showing the form', () => {
    useAuth.mockReturnValue({ user: null, isAuthenticated: false })
    render(<MemoryRouter><Contact /></MemoryRouter>)
    expect(screen.getByText('Sign in to send a message')).toBeInTheDocument()
    expect(screen.queryByLabelText('Message')).toBeNull()
  })

  it('sends the message and shows confirmation', async () => {
    axios.post.mockResolvedValue({ data: { message: 'Message sent successfully' } })
    render(<MemoryRouter><Contact /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello developer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/contact', {
      email: 'student@example.com',
      message: 'Hello developer',
    }, { withCredentials: true }))
    expect(await screen.findByText('Message sent')).toBeInTheDocument()
  })

  it('shows an error when sending fails', async () => {
    axios.post.mockRejectedValue(new Error('Network failed'))
    render(<MemoryRouter><Contact /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello developer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))
    expect(await screen.findByText('Unable to send your message.')).toBeInTheDocument()
  })
})
